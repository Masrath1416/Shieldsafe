const prisma = require('../config/prismaClient');

/**
 * @desc    Start a safety timer
 * @route   POST /api/timer/start
 * @access  Private
 */
const startTimer = async (req, res) => {
  const { duration } = req.body;

  if (!duration) {
    return res.status(400).json({ message: 'Duration required' });
  }

  try {
    const timer = await prisma.safetyTimer.create({
      data: {
        userId: req.user.id,
        duration,
        status: 'Running',
      },
    });
    res.status(201).json(timer);
  } catch (error) {
    res.status(500).json({ message: 'Error starting timer' });
  }
};

/**
 * @desc    Check-in to safety timer
 * @route   POST /api/timer/checkin
 * @access  Private
 */
const checkIn = async (req, res) => {
  const { timerId } = req.body;

  try {
    const timer = await prisma.safetyTimer.findFirst({
      where: { id: timerId, userId: req.user.id },
    });

    if (!timer) {
      return res.status(404).json({ message: 'Timer not found' });
    }

    const updatedTimer = await prisma.safetyTimer.update({
      where: { id: timerId },
      data: { status: 'Safe' },
    });

    res.json({ message: 'Check-in successful', timer: updatedTimer });
  } catch (error) {
    res.status(500).json({ message: 'Error during check-in' });
  }
};

module.exports = { startTimer, checkIn };
