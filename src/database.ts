import {
  int,
  sqliteTable,
  text,
  blob,
} from "drizzle-orm/sqlite-core";

export const analyticTable = sqliteTable("analytic", {
  id: text().primaryKey(),
  userId: text("user_id").notNull(),
  data: blob({ mode: "json" }),
  createdAt: text("created_at"),
});
