import { int, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

export const analyticTable = sqliteTable("analytic", {
  id: text().primaryKey(),
  user_id: text().notNull(),
  data: blob({ mode: "json" }),
});
