import { generateRandomString } from "../utils/random.js";
export async function generateState() {
  const codeVerifier = generateRandomString(128);
  const state = generateRandomString(32);
  return {
    codeVerifier,
    state,
  };
}
