import "server-only";
import { MAX_UPLOAD_BYTES } from "@/lib/activity-files";

// Lit un fichier envoyé à la messagerie : ?name=<nom> + le corps de la requête = le fichier.

export function uploadFromRequest(
  request: Request,
):
  | { file: { name: string; mime: string; body: ReadableStream<Uint8Array> } }
  | { error: string; status: number } {
  const name = new URL(request.url).searchParams.get("name")?.trim();
  if (!name) return { error: "The file has no name.", status: 400 };
  if (!request.body) return { error: "The file is empty.", status: 400 };
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES) return { error: "This file is too big.", status: 413 };
  return { file: { name, mime: request.headers.get("content-type") ?? "", body: request.body } };
}
