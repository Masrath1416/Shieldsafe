// Database is disabled. Mock Prisma client to prevent runtime crashes.
console.log("Mocking Prisma Client to disable database completely.");
const prisma = {
  $disconnect: async () => {},
  user: { findUnique: async () => null, create: async () => null },
  emergencyContact: { findMany: async () => [], create: async () => null, delete: async () => null },
  journey: { create: async () => null, findFirst: async () => null, update: async () => null, findMany: async () => [] },
  location: { create: async () => null, findFirst: async () => null, findMany: async () => [] },
  sosAlert: { create: async () => null, findMany: async () => [] },
  safetyTimer: { create: async () => null, findFirst: async () => null, update: async () => null }
};

module.exports = prisma;
