import { base64Url } from "@better-auth/utils/base64";

export async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64Url.encode(new Uint8Array(hash), {
    padding: false,
  });
}
