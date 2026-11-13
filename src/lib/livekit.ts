import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { headers } from "next/headers";

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
  /** Infos visibles par les autres (ex : {"country":"MG"}) */
  metadata?: string;
}): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitConfig();
  const token = new AccessToken(apiKey, apiSecret, {
    identity: options.identity,
    name: options.name,
    metadata: options.metadata,
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

/**
 * L'adresse LiveKit à donner au navigateur.
 * Si le .env dit "localhost", on la remplace par l'adresse utilisée pour ouvrir le site
 * (ex : 192.168.1.82) : sur un autre PC, "localhost" voudrait dire "cet autre PC".
 */
export async function getBrowserLiveKitUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!configured) throw new Error("NEXT_PUBLIC_LIVEKIT_URL est absent du fichier .env");

  const url = new URL(configured);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    const host = (await headers()).get("host"); // ex : "192.168.1.82:3000"
    if (host) url.hostname = new URL(`http://${host}`).hostname;
  }
  return url.toString().replace(/\/$/, "");
}
