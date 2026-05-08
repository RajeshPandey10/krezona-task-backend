import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node seed-db.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
