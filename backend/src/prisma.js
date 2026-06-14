const { PrismaClient } = require("@prisma/client");

// Create a single Prisma Client instance
const prisma = new PrismaClient();

// Export it so we can use it in other files
module.exports = prisma;