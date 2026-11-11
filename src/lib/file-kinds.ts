// Les sortes de fichiers des activites, et comment les montrer pendant l appel.
// Sans "server-only" : utilise par le navigateur ET par le serveur.

export type FileKind = "pdf" | "image" | "video" | "audio" | "office" | "other";

/** Ce que la fenetre partagee de l appel sait afficher. */
export type ViewKind = "pdf" | "image" | "video" | "audio" | "none";

const OFFICE = ["ppt", "pptx", "pps", "ppsx", "odp", "key", "doc", "docx", "odt", "rtf", "xls", "xlsx", "ods", "csv"];
const IMAGE = ["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp", "svg"];
const VIDEO = ["mp4", "webm", "mov", "m4v", "ogv"];
const AUDIO = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"];

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** La sorte d un fichier, d apres son nom (et son type MIME en secours). */
export function fileKindOf(name: string, mime = ""): FileKind {
  const ext = extensionOf(name);
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (OFFICE.includes(ext)) return "office";
  if (IMAGE.includes(ext) || mime.startsWith("image/")) return "image";
  if (VIDEO.includes(ext) || mime.startsWith("video/")) return "video";
  if (AUDIO.includes(ext) || mime.startsWith("audio/")) return "audio";
  return "other";
}

/** Comment l afficher : un PowerPoint devient un PDF (quand sa conversion est prete). */
export function viewKindOf(kind: string, pdfStatus: string | null): ViewKind {
  if (kind === "pdf" || kind === "image" || kind === "video" || kind === "audio") return kind;
  if (kind === "office" && pdfStatus === "ready") return "pdf";
  return "none";
}

/** L adresse du fichier (ou de sa version PDF). */
export function fileUrl(id: string, viewKind: ViewKind, kind: string): string {
  return kind === "office" && viewKind === "pdf"
    ? `/api/activity-files/${id}?variant=pdf`
    : `/api/activity-files/${id}`;
}

/** 1536 -> "1.5 KB" */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Une petite icone par sorte (emoji). */
export function fileEmoji(kind: string, name = ""): string {
  const ext = extensionOf(name);
  if (kind === "pdf") return "📕";
  if (kind === "image") return "🖼️";
  if (kind === "video") return "🎬";
  if (kind === "audio") return "🎧";
  if (kind === "office") {
    if (["ppt", "pptx", "pps", "ppsx", "odp", "key"].includes(ext)) return "📊";
    if (["xls", "xlsx", "ods", "csv"].includes(ext)) return "📈";
    return "📝";
  }
  return "📎";
}

/** Un fichier tel que l ecran le recoit (dates en texte). */
export type ActivityFileView = {
  id: string;
  name: string;
  size: number;
  kind: string;
  pdfStatus: string | null;
  viewKind: ViewKind;
  url: string;
};
