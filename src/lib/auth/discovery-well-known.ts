export interface DiscoveryWellKnown {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  response_modes_supported: string[];
}

async function getDiscoveryWellKnown(
  issuer: string
): Promise<DiscoveryWellKnown> {
  try {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch discovery well-known: ${response.statusText}`
      );
    }
    const data: DiscoveryWellKnown = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching discovery well-known: ${error}`);
    throw error;
  }
}

export { getDiscoveryWellKnown };
