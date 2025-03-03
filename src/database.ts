import { int, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user", {
  ohoId: text().primaryKey(),
  userId: text(),
  data: blob({ mode: "json" }),
});

export const analyticTable = sqliteTable("analytic", {
  id: text().primaryKey(),
  ohoPixel: text("oho_pixel").notNull(),
  clientId: text("user_id").notNull(),
  type: text(),
  user: blob({ mode: "json" }),
  data: blob({ mode: "json" }),
  timestamp: text(),
  createdAt: text("created_at"),
});
