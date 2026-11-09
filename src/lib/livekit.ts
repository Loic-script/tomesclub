import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

// ⚠️ Ce fichier est uniquement pour le SERVEUR (route API, Server Action...).
// Il utilise LIVEKIT_API_SECRET, qui ne doit jamais aller dans le navigateur.

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} est absent du fichier .env`);
  }
  return value;
}

export function getLiveKitConfig() {
  return {
    url: readEnv("LIVEKIT_URL"),
    apiKey: readEnv("LIVEKIT_API_KEY"),
    apiSecret: readEnv("LIVEKIT_API_SECRET"),
  };
}

/** Client pour gérer les salles côté serveur (lister, fermer, retirer un participant...). */
export function createRoomServiceClient(): RoomServiceClient {
  const { url, apiKey, apiSecret } = getLiveKitConfig();
  // L'API de gestion utilise HTTP : ws:// devient http://, wss:// devient https://
  return new RoomServiceClient(url.replace(/^ws/, "http"), apiKey, apiSecret);
}

/**
 * Crée un "ticket d'entrée" (token) pour qu'une personne rejoigne une salle vidéo.
 * Les droits (parler, voir, partager l'écran...) seront ajustés selon l'organisation de l'app.
 */
export async function createParticipantToken(options: {
  identity: string;
  name?: string;
  roomName: string;
}): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitConfig();
  const token = new AccessToken(apiKey, apiSecret, {
    identity: options.identity,
    name: options.name,
    ttl: "2h",
  });
  token.addGrant({
    roomJoin: true,
    room: options.roomName,
    canPublish: true,
    canSubscribe: true,
  });
  return token.toJwt();
}
