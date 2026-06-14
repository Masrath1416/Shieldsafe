const prisma = require("../prisma");

// START TIMER
exports.startTimer = async (req, res) => {
  try {
    const { userId, duration } = req.body; // duration in minutes

    const timer = await prisma.safetyTimer.create({
      data: {
        userId,
        duration,
        status: "Running",
      },
    });

    res.json({
      message: "Timer started",
      timer,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// CHECK IN (USER SAFE)
exports.checkIn = async (req, res) => {
  try {
    const { timerId } = req.body;

    const timer = await prisma.safetyTimer.update({
      where: { id: timerId },
      data: {
        status: "Safe",
      },
    });

    res.json({
      message: "User marked safe",
      timer,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// GET USER TIMERS
exports.getTimers = async (req, res) => {
  try {
    const { userId } = req.params;

    const timers = await prisma.safetyTimer.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
    });

    res.json(timers);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};