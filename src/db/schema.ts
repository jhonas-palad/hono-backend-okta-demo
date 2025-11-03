import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const verification = sqliteTable("verification", {
  state: text("state").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  returnUrl: text("return_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const appSessionCodes = sqliteTable("app_session_codes", {
  code: text("code").primaryKey(),
  accessToken: text("access_token").notNull(),
  expiresIn: integer("expires_in").notNull(),
  redeemed: integer("redeemed", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});
