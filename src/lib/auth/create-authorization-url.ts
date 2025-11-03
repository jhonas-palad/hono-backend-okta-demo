import { generateCodeChallenge } from "./generate-code-challenge.js";

async function createAuthorizationUrl({
  authorizationEndpoint,
  clientId,
  codeVerifier,
  state,
  redirectURI,
  scopes = ["openid", "profile", "email"],
  responseType = "code",
}: {
  authorizationEndpoint: string;
  clientId: string;
  codeVerifier: string;
  state: string;
  redirectURI: string;
  scopes?: string[];
  responseType?: string;
}) {
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", responseType);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("redirect_uri", redirectURI);
  if (codeVerifier) {
    /**
     * INFO: PKCE (Proof Key for Code Exchange) works by having the app generate a random value
     * at the beginning of the flow called a Code Verifier. The app hashes the Code Verifier and
     * the result is called the Code Challenge. The app then kicks off the flow in the normal way,
     * except that it includes the Code Challenge in the query string for the request to the
     * Authorization Server.
     *
     * Code verifier: A random URL-safe string with a minimum length of 43 characters
     * Code challenge: A Base64-encoded SHA-256 hash of the code verifier
     *
     * References:
     * https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce#use-pkce-to-make-your-apps-more-secure
     * https://developer.okta.com/docs/guides/implement-grant-type/authcodepkce/main/#create-the-proof-key-for-code-exchange
     *
     * This code can only be used once, and remains valid for 300 seconds, during which time
     * it can be exchanged for tokens.
     */

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallenge);
  }
  return url;
}

export { createAuthorizationUrl };
