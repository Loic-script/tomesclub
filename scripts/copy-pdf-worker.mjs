// Copie le "worker" de pdf.js dans /public : le navigateur le charge pour lire les PDF.
// Lance automatiquement apres "npm install" (script postinstall).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const source = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
if (existsSync(source)) {
  mkdirSync("public", { recursive: true });
  copyFileSync(source, "public/pdf.worker.min.mjs");
}
