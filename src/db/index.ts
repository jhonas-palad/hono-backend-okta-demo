import "dotenv/config";

import { drizzle } from "drizzle-orm/libsql";
import { Client, createClient } from "@libsql/client";
import * as schema from "./schema.js";
/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Client;
};

export const client =
  globalForDb.client ?? createClient({ url: process.env.DB_FILE_NAME! });
if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { 
  schema: {
    ...schema,
  },
});
