// Fabrique public/logo.png : seulement le cercle du logo (anneau orange + crème),
// extérieur transparent. Lancer avec : npx tsx scripts/make-round-logo.ts
import sharp from "sharp";

async function main() {
  const source = sharp("public/logo.jpeg");
  const { width = 0, height = 0 } = await source.metadata();
  const { data } = await source.raw().toBuffer({ resolveWithObject: true });

  // On cherche les pixels orange de l'anneau pour trouver le cercle.
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      if (r >= 200 && g >= 110 && g <= 185 && b <= 130) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  if (xs.length < 1000) throw new Error("Anneau orange introuvable");

  // Percentiles : les quelques pixels parasites (drapeaux...) ne comptent plus.
  const percentile = (values: number[], p: number) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  };
  const minX = percentile(xs, 0.5),
    maxX = percentile(xs, 99.5);
  const minY = percentile(ys, 0.5),
    maxY = percentile(ys, 99.5);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const radius = Math.min(maxX - minX, maxY - minY) / 2;
  console.log({ width, height, cx, cy, radius, orangePixels: xs.length });

  // Carré autour du cercle (sans sortir de l'image)
  const left = Math.max(0, Math.round(cx - radius));
  const top = Math.max(0, Math.round(cy - radius));
  const size = Math.min(Math.round(radius * 2), width - left, height - top);

  // Masque rond : tout ce qui est hors du cercle devient transparent.
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="#fff"/></svg>`,
  );

  await sharp("public/logo.jpeg")
    .extract({ left, top, width: size, height: size })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile("public/logo.png");

  console.log(`public/logo.png créé (${size}x${size}, coins transparents)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
