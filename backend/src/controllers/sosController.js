const prisma = require('../config/prismaClient');

/**
 * @desc    Trigger an SOS alert
 * @route   POST /api/sos
 * @access  Private
 */
const triggerSOS = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Location coordinates required' });
  }

  try {
    const alert = await prisma.sosAlert.create({
      data: {
        userId: req.user.id,
        latitude,
        longitude,
      },
    });

    // In a real app, this is where you'd trigger SMS/Notifications
    console.log(`SOS Alert Triggered for user ${req.user.name} at (${latitude}, ${longitude})`);

    res.status(201).json({
      message: 'SOS Alert Triggered Successfully!',
      alert,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error triggering SOS alert' });
  }
};

/**
 * @desc    Log a fake call (Backend logging only as per requirement)
 * @route   POST /api/sos/fake-call
 * @access  Private
 */
const logFakeCall = async (req, res) => {
  console.log(`Fake Call initiated by user ${req.user.name} at ${new Date().toISOString()}`);
  res.json({ message: 'Fake call event logged' });
};

module.exports = { triggerSOS, logFakeCall };
