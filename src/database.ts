import { int, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

export const analyticTable = sqliteTable("analytic", {
  id: text().primaryKey(),
  ohoPixelId: text("oho_pixel_id").notNull(),
  clientId: text("user_id").notNull(),
  sessionId: text("session_id"),
  chatUser: blob({ mode: "json" }),
  authUser: blob({ mode: "json" }),

  // event data
  type: text(),
  buttonClick: blob({ mode: "json" }),
  userData: blob({ mode: "json" }),
  ads: blob({ mode: "json" }),
  page: blob({ mode: "json" }),
  timestamp: text(),
  createdAt: text("created_at"),
});

export const settingTable = sqliteTable("setting", {
  ohoPixelId: text("oho_pixel_id").primaryKey(),
  livechat: blob({ mode: "json" }),
  tracking: blob({ mode: "json" }),
});

export const systemConfig = sqliteTable("system_config", {
  name: text().primaryKey(),
  config: blob({ mode: "json" }),
});
