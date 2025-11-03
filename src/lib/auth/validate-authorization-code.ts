export function createAuthorizationCodeRequest({
  code,
  codeVerifier,
  redirectURI,
  clientId,
  clientSecret,
}: {
  code: string;
  redirectURI: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
}) {
  const body = new URLSearchParams();
  const requestHeaders: Record<string, any> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("code_verifier", codeVerifier);
  body.set("redirect_uri", redirectURI);
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  return {
    body,
    headers: requestHeaders,
  };
}

/**
 * INFO: Validate Authorization Code
 * Sample response
 * ```
 *  {
 *  "access_token": "eyJhb[...]Hozw",
 *  "expires_in": 3600,
 *  "id_token": "eyJhb[...]jvCw",
 *  "scope": "openid",
 *  "token_type": "Bearer"
 * }
 * ```
 *
 * Sample error response (400 Bad Request)
 * ```
 *  {
 *  "error": "invalid_grant",
 *  "error_description": "Invalid authorization code"
 * }
 * ```
 */
async function validateAuthorizationCode({
  code,
  codeVerifier,
  redirectURI,
  clientId,
  clientSecret,
  tokenEndpoint,
}: {
  code: string;
  redirectURI: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
}): Promise<{
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
  scopes?: string[];
}> {
  const { body, headers } = createAuthorizationCodeRequest({
    code,
    codeVerifier,
    redirectURI,
    clientId,
    clientSecret,
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers,
      body,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Failed to validate authorization code: ${response.statusText}`
      );
    }
    return {
      tokenType: data.token_type,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      refreshTokenExpiresIn: data.refresh_token_expires_in,
      scopes: data?.scope
        ? typeof data.scope === "string"
          ? data.scope.split(" ")
          : data.scope
        : [],
      idToken: data.id_token,
    };
  } catch (error) {
    console.error(`Error validating authorization code: ${error}`);
    throw error;
  }
}

export { validateAuthorizationCode };
