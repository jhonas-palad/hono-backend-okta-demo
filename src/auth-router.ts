import { Hono } from "hono";
import { env } from "hono/adapter";
import { getDiscoveryWellKnown } from "./lib/auth/discovery-well-known.js";
import type { DiscoveryWellKnown } from "./lib/auth/discovery-well-known.js";
import { generateState } from "./lib/auth/generate-state.js";
import { createAuthorizationUrl } from "./lib/auth/create-authorization-url.js";
import { validateAuthorizationCode } from "./lib/auth/validate-authorization-code.js";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";
import { eq } from "drizzle-orm";
import { getRequestBaseUrl } from "./lib/get-request-base-url.js";
const authRouter = new Hono();

type EnvContext = {
  OKTA_ISSUER: string;
  OKTA_CLIENT_ID: string;
  OKTA_CLIENT_SECRET: string;
};

authRouter.get("/login", async (c) => {
  const envContext = env<EnvContext>(c);
  const returnUrl = c.req.query("return_url");

  const baseUrl = getRequestBaseUrl(c);
  const redirectURI = `${baseUrl}/auth/callback`;

  const discoveryWellKnown: DiscoveryWellKnown = await getDiscoveryWellKnown(
    envContext.OKTA_ISSUER
  );

  const authorizationEndpoint = discoveryWellKnown.authorization_endpoint;

  // This should be stored in a persistent storage
  const { codeVerifier, state } = await generateState();

  const verification = await db
    .insert(schema.verification)
    .values({
      state,
      identifier: "state_verification",
      value: codeVerifier,
      returnUrl,
    })
    .returning();

  if (!verification) {
    return c.json({ error: "Failed to store verification" }, 500);
  }

  const authorizationUrl = await createAuthorizationUrl({
    authorizationEndpoint,
    clientId: envContext.OKTA_CLIENT_ID,
    codeVerifier,
    state,
    redirectURI,
  });

  return c.json({
    url: authorizationUrl.toString(),
    returnUrl,
    codeVerifier,
    state,
  });
});

authRouter.get("/callback", async (c: any) => {
  const envContext = env(c);
  /**
   * code: The OAuth2 code
   * state: state parameter from the OAuth2 request
   * error: The error message, if any
   * error_description: The error description, if any
   */
  const { code, state, error, error_description } = c.req.query();

  const baseUrl = getRequestBaseUrl(c);
  const redirectURI = `${baseUrl}/auth/callback`;

  const discoveryWellKnown: DiscoveryWellKnown = await getDiscoveryWellKnown(
    envContext.OKTA_ISSUER
  );

  const tokenEndpoint = discoveryWellKnown.token_endpoint;

  const verification = await db.query.verification.findFirst({
    where: eq(schema.verification.state, state),
  });
  if (!verification) {
    return c.json({ error: "Verification not found" }, 404);
  }

  const {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
    refreshTokenExpiresIn,
    scopes,
  } = await validateAuthorizationCode({
    code,
    codeVerifier: verification.value,
    redirectURI,
    clientId: envContext.OKTA_CLIENT_ID,
    clientSecret: envContext.OKTA_CLIENT_SECRET,
    tokenEndpoint,
  });

  console.log(
    "[VALIDATED TOKEN]",
    JSON.stringify({
      tokenType,
      accessToken,
      refreshToken,
      expiresIn,
      refreshTokenExpiresIn,
      scopes,
    })
  );

  const appSessionCode = await db
    .insert(schema.appSessionCodes)
    .values({
      code,
      accessToken,
      // store as Unix seconds: now + 5 minutes
      expiresIn: Math.floor(Date.now() / 1000) + 5 * 60,
      redeemed: false,
    })
    .returning();

  if (!appSessionCode.length) {
    return c.json({ error: "Failed to store app session code" }, 500);
  }

  //Handle token here, do whatever you want... save it to the db ofcourse

  const redirectUrl = new URL(
    verification.returnUrl || "http://localhost:3000"
  );
  redirectUrl.searchParams.set("code", code);
  return c.redirect(redirectUrl.toString());
});

authRouter.post("/token", async (c) => {
  const body = await c.req.json().catch(() => undefined);
  const incoming = body ?? {};
  const codeParam = typeof incoming === "string" ? incoming : incoming.code;
  const code = codeParam ?? c.req.query("code");

  if (typeof code !== "string" || code.length === 0) {
    return c.json({ error: "Code is required" }, 400);
  }

  const appSessionCode = await db.query.appSessionCodes.findFirst({
    where: eq(schema.appSessionCodes.code, code),
  });

  if (!appSessionCode) {
    return c.json({ error: "App session code not found" }, 404);
  }

  // const nowSec = Math.floor(Date.now() / 1000);

  // if (nowSec > appSessionCode.expiresIn) {
  //   return c.json({ error: "Code has expired" }, 400);
  // }

  if (appSessionCode.redeemed) {
    return c.json({ error: "Code already redeemed" }, 400);
  }
  return c.json({
    accessToken: appSessionCode.accessToken,
    expiresIn: appSessionCode.expiresIn,
  });
});

export default authRouter;
// https://cebupacificair-dev.oktapreview.com/oauth2/default/v1/authorize?client_id=0oa1l6n3i7ecQrNtF0h8&response_type=code&state=vQtcSSC1grAg4zXHrGcNC4T0QuDFTJSs&scope=openid+profile+email&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauthorization-code%2Fcallback&code_challenge_method=S256&code_challenge=N_paWdQUJ6B8fB19WRXmccfLxr3ccHtALoGHXJ8DEuM#
// https://cebupacificair-dev.oktapreview.com/oauth2/default/v1/authorize?client_id=0oa1l6n3i7ecQrNtF0h8&response_type=code&state=vQtcSSC1grAg4zXHrGcNC4T0QuDFTJSs&scope=openid+profile+email&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauthorization-code%2Fcallback&code_challenge_method=S256&code_challenge=N_paWdQUJ6B8fB19WRXmccfLxr3ccHtALoGHXJ8DEuM
