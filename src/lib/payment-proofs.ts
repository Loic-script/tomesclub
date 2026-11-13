import "server-only";
import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import path from "node:path";
import { cleanFileName, safeExtension, storageRoot, writeUpload } from "@/lib/activity-files";
import { prisma } from "@/lib/prisma";

// Les captures d'écran de paiement MVola (salle privée, événement payant).
// L'image est sur le disque : <dossier des fichiers>/payment-proofs/<id>.<ext>
// Seuls l'admin et le membre qui l'a envoyée peuvent la voir.

/** Taille maximum d'une capture : 8 Mo. */
export const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function proofPath(id: string, name: string): string {
  return path.join(storageRoot(), "payment-proofs", `${id}${safeExtension(name)}`);
}

export function isProofImage(mime: string): boolean {
  return IMAGE_TYPES.includes(mime);
}

/** Enregistre une capture envoyée par un membre. Rend son identifiant. */
export async function savePaymentProof(input: {
  userId: string;
  name: string;
  mime: string;
  body: ReadableStream<Uint8Array>;
}): Promise<string> {
  const id = randomUUID();
  const name = cleanFileName(input.name);
  const size = await writeUpload(input.body, proofPath(id, name));
  await prisma.paymentProof.create({ data: { id, userId: input.userId, name, mime: input.mime, size } });
  return id;
}

/** La capture appartient-elle bien à ce membre ? (avant de l'attacher à une salle ou une inscription) */
export async function isOwnProof(id: string | null | undefined, userId: string): Promise<boolean> {
  if (!id) return false;
  const proof = await prisma.paymentProof.findFirst({ where: { id, userId }, select: { id: true } });
  return Boolean(proof);
}

/** Ouvre une capture, si la personne a le droit de la voir (admin, ou le membre qui l'a envoyée). */
export async function openPaymentProof(
  id: string,
  viewer: { admin: true } | { userId: string },
): Promise<{ path: string; size: number; mime: string; name: string } | null> {
  const proof = await prisma.paymentProof.findUnique({ where: { id } });
  if (!proof) return null;
  if (!("admin" in viewer) && viewer.userId !== proof.userId) return null;
  const file = proofPath(proof.id, proof.name);
  const info = await stat(file).catch(() => null);
  if (!info) return null;
  return { path: file, size: info.size, mime: proof.mime, name: proof.name };
}
