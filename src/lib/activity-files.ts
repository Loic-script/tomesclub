import "server-only";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  extensionOf,
  fileKindOf,
  fileUrl,
  viewKindOf,
  type ActivityFileView,
} from "@/lib/file-kinds";
import { prisma } from "@/lib/prisma";

// Les fichiers des activites : sur le disque (le volume du service en production),
// une ligne par fichier dans la base.

/** Taille maximum d un fichier (Mo), reglable avec MAX_UPLOAD_MB. */
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 1024) * 1024 * 1024;

/** Le dossier des fichiers : le volume Mini Railway, sinon UPLOAD_DIR, sinon ./uploads */
function baseDir(): string {
  const root =
    process.env.TWINS_VOLUME_MOUNT_PATH || process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  return path.join(root, "activity-files");
}

function originalPath(id: string, name: string): string {
  const ext = extensionOf(name).replace(/[^a-z0-9]/g, "").slice(0, 10);
  return path.join(baseDir(), ext ? `${id}.${ext}` : id);
}

function pdfPath(id: string): string {
  return path.join(baseDir(), "pdf", `${id}.pdf`);
}

/** Pour l ecran : ajoute ce qu il faut savoir pour l afficher. */
export function toView(row: { id: string; name: string; size: number; kind: string; pdfStatus: string | null }): ActivityFileView {
  const viewKind = viewKindOf(row.kind, row.pdfStatus);
  return { ...row, viewKind, url: fileUrl(row.id, viewKind, row.kind) };
}

/** Les fichiers de plusieurs activites, ranges par cle. */
export async function listFilesByActivity(keys?: string[]): Promise<Record<string, ActivityFileView[]>> {
  const rows = await prisma.activityFile.findMany({
    where: keys ? { activityKey: { in: keys } } : undefined,
    orderBy: { createdAt: "asc" },
    select: { id: true, activityKey: true, name: true, size: true, kind: true, pdfStatus: true },
  });
  const result: Record<string, ActivityFileView[]> = {};
  for (const { activityKey, ...row } of rows) {
    (result[activityKey] ??= []).push(toView(row));
  }
  return result;
}

/** Les fichiers d une activite. */
export async function listFilesForActivity(key: string | null): Promise<ActivityFileView[]> {
  if (!key) return [];
  return (await listFilesByActivity([key]))[key] ?? [];
}

export class UploadTooBigError extends Error {}

/** Enregistre un fichier envoye (flux), sans tout garder en memoire. */
export async function saveActivityFile(input: {
  activityKey: string;
  name: string;
  mime: string;
  body: ReadableStream<Uint8Array>;
}): Promise<{ id: string; kind: string }> {
  const id = randomUUID();
  const name = input.name.replace(/[\/\u0000-\u001f]/g, "").trim().slice(0, 160) || "file";
  const kind = fileKindOf(name, input.mime);
  const target = originalPath(id, name);
  const partial = `${target}.part`;
  await mkdir(path.dirname(target), { recursive: true });

  let size = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) done(new UploadTooBigError("too big"));
      else done(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(input.body as import("node:stream/web").ReadableStream), counter, createWriteStream(partial));
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
  await rename(partial, target);

  await prisma.activityFile.create({
    data: {
      id,
      activityKey: input.activityKey,
      name,
      mime: input.mime || "application/octet-stream",
      size,
      kind,
      pdfStatus: kind === "office" ? "pending" : null,
    },
  });
  return { id, kind };
}

/** Lance LibreOffice (soffice) pour faire un PDF. Rejette si absent ou en erreur. */
function runSoffice(binary: string, input: string, outDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      binary,
      [
        "-env:UserInstallation=file:///tmp/tomes-libreoffice",
        "--headless",
        "--norestore",
        "--convert-to",
        "pdf",
        "--outdir",
        outDir,
        input,
      ],
      { timeout: 3 * 60 * 1000 },
      (error) => (error ? reject(error) : resolve()),
    );
  });
}

/** PowerPoint / Word / Excel -> PDF (pour l afficher page par page pendant l appel). */
export async function convertToPdf(id: string): Promise<void> {
  const row = await prisma.activityFile.findUnique({ where: { id }, select: { name: true, kind: true } });
  if (!row || row.kind !== "office") return;
  const input = originalPath(id, row.name);
  const outDir = path.join(baseDir(), "pdf");
  await mkdir(outDir, { recursive: true });

  let ok = false;
  for (const binary of [process.env.SOFFICE_PATH, "soffice", "libreoffice"].filter(Boolean) as string[]) {
    try {
      await runSoffice(binary, input, outDir);
      // LibreOffice garde le nom du fichier : "<id>.pptx" -> "<id>.pdf"
      await stat(pdfPath(id));
      ok = true;
      break;
    } catch {
      // On essaie le nom suivant.
    }
  }
  if (!ok) console.warn("[activity-files] PDF conversion failed (is LibreOffice installed?)", id);
  await prisma.activityFile.updateMany({ where: { id }, data: { pdfStatus: ok ? "ready" : "failed" } });
}

/** Ouvre un fichier pour l envoyer au navigateur (avec "Range" pour les videos). */
export async function openActivityFile(
  id: string,
  variant: "original" | "pdf",
): Promise<{ path: string; size: number; mime: string; name: string } | null> {
  const row = await prisma.activityFile.findUnique({ where: { id } });
  if (!row) return null;
  if (variant === "pdf") {
    if (row.pdfStatus !== "ready") return null;
    const file = pdfPath(id);
    const info = await stat(file).catch(() => null);
    if (!info) return null;
    return { path: file, size: info.size, mime: "application/pdf", name: row.name.replace(/\.[^.]+$/, "") + ".pdf" };
  }
  const file = originalPath(id, row.name);
  const info = await stat(file).catch(() => null);
  if (!info) return null;
  return { path: file, size: info.size, mime: row.mime, name: row.name };
}

/** Un morceau du fichier (ou tout), en flux web. */
export function fileStream(file: string, start?: number, end?: number): ReadableStream<Uint8Array> {
  return Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream<Uint8Array>;
}

/** Supprime un fichier (disque + base). */
export async function deleteActivityFile(id: string): Promise<void> {
  const row = await prisma.activityFile.findUnique({ where: { id }, select: { name: true } });
  if (!row) return;
  await rm(originalPath(id, row.name), { force: true });
  await rm(pdfPath(id), { force: true });
  await prisma.activityFile.delete({ where: { id } });
}

/** Supprime tous les fichiers d une activite (quand l activite est supprimee). */
export async function deleteFilesOfActivity(key: string): Promise<void> {
  const rows = await prisma.activityFile.findMany({ where: { activityKey: key }, select: { id: true } });
  for (const row of rows) await deleteActivityFile(row.id);
}

/** Relance la conversion d un fichier (bouton "Retry"). */
export async function retryConversion(id: string): Promise<void> {
  await prisma.activityFile.updateMany({ where: { id, kind: "office" }, data: { pdfStatus: "pending" } });
  await convertToPdf(id);
}
