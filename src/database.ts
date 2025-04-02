import { sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

export const analyticTable = sqliteTable("analytic", {
  id: text().primaryKey(),
  ohoPixelId: text("oho_pixel_id").notNull(),
  clientId: text("user_id").notNull(),
  sessionId: text("session_id"),
  chatUser: text({ mode: "json" }),
  authUser: text({ mode: "json" }),

  // event data
  type: text(),
  button: text({ mode: "json" }),
  userData: text({ mode: "json" }),
  ads: text({ mode: "json" }),
  page: text({ mode: "json" }),
  timestamp: text(),
  createdAt: text("created_at"),
});

export const settingTable = sqliteTable("setting", {
  ohoPixelId: text("oho_pixel_id").primaryKey(),
  livechat: text({ mode: "json" }),
  tracking: text({ mode: "json" }),
});

export const domainWhitelistTable = sqliteTable("domain_whitelist", {
  ohoPixelId: text("oho_pixel_id").primaryKey(),
  config: text({ mode: "json" }).$type<string[]>(),
});
