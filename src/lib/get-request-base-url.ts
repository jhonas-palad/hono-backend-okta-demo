import type { Context } from "hono";

export const getRequestBaseUrl = (c: Context) => {
  const requestUrl = new URL(c.req.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.hostname}${
    requestUrl.port ? `:${requestUrl.port}` : ""
  }`; // e.g., "https://example.com:3000"
  return baseUrl;
};
