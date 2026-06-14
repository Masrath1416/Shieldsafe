const prisma = require("../prisma");

// START JOURNEY
exports.startJourney = async (req, res) => {
  try {
    const { destination, eta } = req.body;
    const userId = req.userId; // Securely get from token

    const journey = await prisma.journey.create({
      data: {
        userId,
        destination,
        eta: new Date(eta),
        status: "In-Progress",
      },
    });

    res.json({
      message: "Journey started ✅ Stay safe!",
      journey,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// COMPLETE JOURNEY
exports.completeJourney = async (req, res) => {
  try {
    const { journeyId } = req.body;

    const journey = await prisma.journey.update({
      where: { id: journeyId },
      data: {
        status: "Completed",
        completedAt: new Date(),
      },
    });

    res.json({
      message: "Journey completed safely",
      journey,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// GET USER JOURNEYS
exports.getJourneys = async (req, res) => {
  try {
    const userId = req.userId; // Securely filter by current user

    const journeys = await prisma.journey.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
    });

    res.json(journeys);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};