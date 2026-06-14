const prisma = require("../prisma");
const { validationResult } = require("express-validator");
const twilio = require("twilio");

// Initialize Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken && twilioPhone && accountSid !== "your_account_sid_here") {
  twilioClient = twilio(accountSid, authToken);
}

exports.triggerSOS = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { latitude, longitude } = req.body;
    const userId = req.userId; // Taken from token by middleware

    const sos = await prisma.sOSAlert.create({
      data: {
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: "Active",
      },
    });

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
    });

    console.log("=== INITIATING SMS ALERT DISPATCH ===");
    const alertsSent = [];

    // Map through contacts and send real SMS if Twilio is configured
    for (const c of contacts) {
      const messageBody = `🚨 EMERGENCY (ShieldSafe): User needs immediate help. Location: https://maps.google.com/?q=${latitude},${longitude}`;
      
      let dispatchStatus = "FAILED";
      
      if (twilioClient) {
        try {
          const message = await twilioClient.messages.create({
            body: messageBody,
            from: twilioPhone,
            to: c.contactPhone
          });
          console.log(`[TWILIO] Sent to ${c.contactName} (${c.contactPhone}) - SID: ${message.sid}`);
          dispatchStatus = "DELIVERED";
        } catch (smsError) {
          console.error(`[TWILIO ERROR] Failed to send to ${c.contactName}:`, smsError.message);
          dispatchStatus = `FAILED: ${smsError.message}`;
        }
      } else {
        // Fallback to simulation if keys are missing
        console.log(`[SMS API MOCK] Sending to ${c.contactName} (${c.contactPhone}): ${messageBody}`);
        dispatchStatus = "MOCKED (Keys Missing)";
      }
      
      alertsSent.push({
        name: c.contactName,
        phone: c.contactPhone,
        status: dispatchStatus,
        timestamp: new Date().toISOString()
      });
    }
    console.log("=== SMS DISPATCH COMPLETE ===");

    res.json({
      message: "SOS Triggered ✅ Emergency contacts notified.",
      sos,
      alertsDispatch: alertsSent,
    });
  } catch (error) {
    console.error("SOS Dispatch Error:", error);
    res.status(500).json({ error: "Failed to dispatch SOS alerts." });
  }
};

exports.getSOSAlerts = async (req, res) => {
  try {
    const userId = req.userId; // Filter by current user
    const data = await prisma.sOSAlert.findMany({
      where: { userId },
      orderBy: { alertTime: "desc" },
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};