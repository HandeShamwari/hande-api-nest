// Prisma 7 Configuration
// Note: DATABASE_URL is only needed for migrations/db push, not for generate
const { defineConfig } = require("prisma/config");

// Load dotenv only if available (not in Docker build)
try {
  require("dotenv/config");
} catch (e) {}

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // URL is only used for db push/migrate, not generate
  // During Docker build (generate), this can be a placeholder
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://build:build@localhost:5432/build",
  },
});
