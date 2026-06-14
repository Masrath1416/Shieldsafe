const prisma = require("../prisma");

// SAVE LOCATION (GPS UPDATE)
exports.saveLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.userId; // Securely get from token

    const location = await prisma.location.create({
      data: {
        userId,
        latitude,
        longitude,
      },
    });

    res.json({
      message: "Location synced ✅",
      location,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// GET USER LOCATION HISTORY
exports.getLocations = async (req, res) => {
  try {
    const userId = req.userId; // Securely filter by current user

    const locations = await prisma.location.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(locations);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};