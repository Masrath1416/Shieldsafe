const prisma = require('../config/prismaClient');

/**
 * @desc    Start a new journey
 * @route   POST /api/journey/start
 * @access  Private
 */
const startJourney = async (req, res) => {
  const { destination, eta } = req.body;

  if (!destination || !eta) {
    return res.status(400).json({ message: 'Destination and ETA required' });
  }

  try {
    const journey = await prisma.journey.create({
      data: {
        userId: req.user.id,
        destination,
        eta: new Date(eta),
        status: 'In-Progress',
      },
    });
    res.status(201).json(journey);
  } catch (error) {
    res.status(500).json({ message: 'Error starting journey' });
  }
};

/**
 * @desc    Mark journey as complete
 * @route   POST /api/journey/complete
 * @access  Private
 */
const completeJourney = async (req, res) => {
  const { journeyId } = req.body;

  try {
    const journey = await prisma.journey.findFirst({
      where: { id: journeyId, userId: req.user.id },
    });

    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    const updatedJourney = await prisma.journey.update({
      where: { id: journeyId },
      data: {
        status: 'Completed',
        completedAt: new Date(),
      },
    });

    res.json(updatedJourney);
  } catch (error) {
    res.status(500).json({ message: 'Error completing journey' });
  }
};

module.exports = { startJourney, completeJourney };
