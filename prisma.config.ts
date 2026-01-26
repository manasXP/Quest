import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local for local development, then .env for database URL
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
