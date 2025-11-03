import * as dotenv from "dotenv";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import authRouter from "./auth-router.js";
import { getRequestBaseUrl } from "./lib/get-request-base-url.js";

dotenv.config();

const app = new Hono();

app.use(logger());

app.get("/", (c) => {
  const requestUrl = new URL(c.req.url);
  const domain = requestUrl.hostname; // e.g., "example.com" or "localhost"
  const baseUrl = `${requestUrl.protocol}//${requestUrl.hostname}${
    requestUrl.port ? `:${requestUrl.port}` : ""
  }`; // e.g., "https://example.com:3000"

  return c.text(`Domain: ${domain}\nBase URL: ${baseUrl}`);
});

app.route("/auth", authRouter);

const server = serve(
  {
    fetch: app.fetch,
    port: 8080,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

// graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
