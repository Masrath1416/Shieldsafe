const prisma = require('../config/prismaClient');

/**
 * @desc    Save current location
 * @route   POST /api/location
 * @access  Private
 */
const saveLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Coordinates required' });
  }

  try {
    const location = await prisma.location.create({
      data: {
        userId: req.user.id,
        latitude,
        longitude,
      },
    });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Error saving location' });
  }
};

/**
 * @desc    Get latest location
 * @route   GET /api/location/latest
 * @access  Private
 */
const getLatestLocation = async (req, res) => {
  try {
    const location = await prisma.location.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!location) {
      return res.status(404).json({ message: 'No location history found' });
    }

    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching latest location' });
  }
};

module.exports = { saveLocation, getLatestLocation };
