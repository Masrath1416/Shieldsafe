// const prisma = require("../prisma");
// const { validationResult } = require("express-validator");
// const twilio = require("twilio");

// // Initialize Twilio Client
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// // Validate required Twilio env vars at startup
// if (!accountSid || !authToken || !twilioPhone) {
//   console.warn('[TWILIO] Missing environment variables. SMS dispatch will be mocked.');
// }

// let twilioClient = null;
// if (accountSid && authToken && twilioPhone && accountSid !== "your_account_sid_here") {
//   twilioClient = twilio(accountSid, authToken);
//   console.log('[TWILIO] Client initialized');
// } else {
//   console.log('[TWILIO] Client not configured – SMS will be mocked');
// }

// exports.triggerSOS = async (req, res) => {
//   // Check validation errors
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const { latitude, longitude, contacts: requestContacts } = req.body;
//     const userId = req.userId; // Taken from token by middleware

//     const sos = await prisma.sOSAlert.create({
//       data: {
//         userId,
//         latitude: parseFloat(latitude),
//         longitude: parseFloat(longitude),
//         status: "Active",
//       },
//     });

//     let contacts;
//       if (Array.isArray(requestContacts) && requestContacts.length > 0) {
//         // Use contacts passed from the frontend (expects objects with name and phone)
//         contacts = requestContacts.map(c => ({ contactName: c.name, contactPhone: c.phone }));
//       } else {
//         contacts = await prisma.emergencyContact.findMany({
//           where: { userId },
//         });
//       }

//     if (!contacts || contacts.length === 0) {
//         console.warn('[TWILIO] No emergency contacts found for user');
//         return res.status(400).json({ error: 'No emergency contacts registered.' });
//       }

//     console.log('=== INITIATING SMS ALERT DISPATCH ===');
//     const alertsSent = [];

//     // Helper to validate phone numbers (basic E.164)
//     const isValidPhone = (num) => /^\+?[1-9]\d{1,14}$/.test(num);

//     for (const c of contacts) {
//       const messageBody = `🚨 EMERGENCY (ShieldSafe): User needs immediate help. Location: https://maps.google.com/?q=${latitude},${longitude}`;
//       let dispatchStatus = 'FAILED';

//       if (!isValidPhone(c.contactPhone)) {
//         console.warn(`[TWILIO] Invalid phone number for contact ${c.contactName}: ${c.contactPhone}`);
//         dispatchStatus = 'INVALID_PHONE';
//       } else if (twilioClient) {
//         try {
//           const message = await twilioClient.messages.create({
//             body: messageBody,
//             from: twilioPhone,
//             to: c.contactPhone,
//           });
//           console.log(`[TWILIO] Sent to ${c.contactName} (${c.contactPhone}) - SID: ${message.sid}`);
//           dispatchStatus = 'DELIVERED';
//         } catch (smsError) {
//           console.error(`[TWILIO ERROR] Failed to send to ${c.contactName}:`, smsError.message);
//           dispatchStatus = `FAILED: ${smsError.message}`;
//         }
//       } else {
//         // Mock mode when Twilio not configured
//         console.log(`[SMS MOCK] Would send to ${c.contactName} (${c.contactPhone}): ${messageBody}`);
//         dispatchStatus = 'MOCKED (Keys Missing)';
//       }

//       alertsSent.push({
//         name: c.contactName,
//         phone: c.contactPhone,
//         status: dispatchStatus,
//         timestamp: new Date().toISOString(),
//       });
//     }

//     console.log('=== SMS DISPATCH COMPLETE ===');

//     res.json({
//       message: 'SOS Triggered ✅ Emergency contacts notified.',
//       sos,
//       alertsDispatch: alertsSent,
//     });
//   } catch (error) {
//     console.error("SOS Dispatch Error:", error);
//     res.status(500).json({ error: "Failed to dispatch SOS alerts." });
//   }
// };

// exports.getSOSAlerts = async (req, res) => {
//   try {
//     const userId = req.userId; // Filter by current user
//     const data = await prisma.sOSAlert.findMany({
//       where: { userId },
//       orderBy: { alertTime: "desc" },
//     });

//     res.json(data);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


const twilio = require("twilio");

// Twilio setup
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.triggerSOS = async (req, res) => {
  try {
    console.log("[API HIT] SOS Triggered");

    const { latitude, longitude, contacts } = req.body;

    // ✅ Validate contacts
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({
        message: "No contacts provided"
      });
    }

    // ✅ Create location message
    const message = `🚨 Emergency! I am in danger.\nMy location:\nhttps://maps.google.com/?q=${latitude},${longitude}`;

    // ✅ Send SMS to all contacts concurrently
    const dispatchPromises = contacts.map(async (contact) => {
      try {
        const response = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        });

        console.log(`[TWILIO] Sent to ${contact.phone} (SID: ${response.sid})`);
        return { name: contact.name, phone: contact.phone, status: "DELIVERED" };

      } catch (err) {
        console.error(`[TWILIO ERROR] ${contact.phone}:`, err.message);
        return { name: contact.name, phone: contact.phone, status: `FAILED: ${err.message}` };
      }
    });

    const alertsDispatch = await Promise.all(dispatchPromises);

    res.json({
      message: "SOS sent successfully",
      alertsDispatch
    });

  } catch (error) {
    console.error("SOS ERROR:", error);
    res.status(500).json({
      message: "Failed to dispatch SOS alerts"
    });
  }
};