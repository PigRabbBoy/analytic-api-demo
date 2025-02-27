import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: 'database.db',
  },
});
