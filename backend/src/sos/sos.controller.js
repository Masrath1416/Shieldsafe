const twilio = require("twilio");

/**
 * Creates and returns a Twilio client using process.env at call time.
 * This ensures Railway-injected environment variables are always picked up,
 * even if dotenv hasn't populated them at module-load time.
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  try {
    return twilio(accountSid, authToken);
  } catch (err) {
    console.error("[TWILIO] Failed to create client:", err.message);
    return null;
  }
}

/**
 * POST /api/sos/trigger
 * Body: { latitude, longitude, contacts: [{ name, phone }] }
 */
exports.triggerSOS = async (req, res) => {
  try {
    console.log("===========================================");
    console.log("[SOS] POST /api/sos/trigger received");
    console.log("[SOS] Body:", JSON.stringify(req.body));

    const { latitude, longitude, contacts } = req.body;

    // ── 1. Validate request body ──────────────────────────────────────────
    if (!Array.isArray(contacts) || contacts.length === 0) {
      console.warn("[SOS] Rejected: no contacts in request body.");
      return res.status(400).json({
        success: false,
        message: "No emergency contacts provided in the request."
      });
    }

    // ── 2. Log received location ──────────────────────────────────────────
    console.log(`[SOS] Location: lat=${latitude}, lng=${longitude}`);
    console.log(`[SOS] Contacts to notify: ${contacts.length}`);

    // ── 3. Read Twilio credentials (at request time, not module-load time) ─
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log("[TWILIO] ACCOUNT_SID present:", !!accountSid);
    console.log("[TWILIO] AUTH_TOKEN present:", !!authToken);
    console.log("[TWILIO] PHONE_NUMBER:", fromNumber || "❌ MISSING");

    if (!accountSid || !authToken || !fromNumber) {
      console.error("[TWILIO] ❌ Missing env vars. Cannot send SMS.");
      return res.status(500).json({
        success: false,
        message: "Twilio credentials are missing on the server. Check Railway environment variables."
      });
    }

    // ── 4. Create Twilio client ───────────────────────────────────────────
    let client;
    try {
      client = twilio(accountSid, authToken);
      console.log("[TWILIO] ✅ Client created successfully.");
    } catch (err) {
      console.error("[TWILIO] ❌ Failed to create client:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to initialize Twilio client: " + err.message
      });
    }

    // ── 5. Build location URL ─────────────────────────────────────────────
    const hasLocation =
      latitude !== undefined &&
      latitude !== null &&
      longitude !== undefined &&
      longitude !== null &&
      latitude !== "" &&
      longitude !== "";

    const locationText = hasLocation
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : "Location not available";

    const messageBody =
      `🚨 Emergency! I am in danger.\n` +
      `📍 Location: ${locationText}`;

    console.log("[SOS] SMS body:", messageBody);

    // ── 6. Send SMS to every contact ──────────────────────────────────────
    console.log("[SOS] Dispatching SMS to all contacts...");

    const dispatchResults = await Promise.all(
      contacts.map(async (contact) => {
        const phone = (contact.phone || "").trim();
        const name  = (contact.name  || "Unknown").trim();

        if (!phone) {
          console.warn(`[TWILIO] Skipping contact "${name}" — no phone number.`);
          return { name, phone, status: "FAILED: No phone number" };
        }

        try {
          const msg = await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: phone
          });

          console.log(`[TWILIO] ✅ SMS sent to ${name} (${phone}) — SID: ${msg.sid}`);
          return { name, phone, status: "DELIVERED", sid: msg.sid };

        } catch (err) {
          console.error(`[TWILIO] ❌ Failed to send to ${name} (${phone}):`, err.message);
          return { name, phone, status: `FAILED: ${err.message}` };
        }
      })
    );

    // ── 7. Summary ────────────────────────────────────────────────────────
    const delivered = dispatchResults.filter(r => r.status === "DELIVERED").length;
    const failed    = dispatchResults.filter(r => r.status !== "DELIVERED").length;

    console.log(`[SOS] Done. Delivered: ${delivered}, Failed: ${failed}`);
    console.log("===========================================");

    return res.status(200).json({
      success: true,
      message: `SOS dispatched. ${delivered} SMS sent, ${failed} failed.`,
      delivered,
      failed,
      location: locationText,
      alertsDispatch: dispatchResults
    });

  } catch (error) {
    console.error("[SOS] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Unexpected server error during SOS dispatch."
    });
  }
};
