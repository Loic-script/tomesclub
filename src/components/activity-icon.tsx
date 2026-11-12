// Les icônes des activités de room : des dessins fins (traits) à la place des emojis.
// La base garde toujours un emoji (ex : "🎤") : ce fichier le traduit en dessin.
// Un emoji inconnu → l'icône "étincelles".
// Pas de "use client" : utilisable côté serveur comme côté navigateur.

type Shape = { paths: string[]; circles?: [number, number, number][] };

const SPARKLES: Shape = {
  paths: ["M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z", "M19 3v4M21 5h-4", "M5 17v3M6.5 18.5h-3"],
};

const SHAPES: Record<string, Shape> = {
  // ----- Les 13 activités du catalogue -----
  "🗣": {
    // Débat : deux bulles qui se répondent
    paths: [
      "M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z",
      "M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1",
    ],
  },
  "💬": { paths: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z", "M8 12h.01M12 12h.01M16 12h.01"] },
  "🎤": {
    paths: ["M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z", "M19 10v2a7 7 0 0 1-14 0v-2", "M12 19v3"],
  },
  "⏱": { paths: ["M10 2h4", "M12 14l3-3", "M19 6l1.5-1.5"], circles: [[12, 14, 8]] },
  "🎲": {
    paths: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"],
  },
  "🎭": {
    paths: [
      "M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z",
      "M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z",
      "M18 11c-1.5 0-3 .5-3 2 2 0 3 0 3-2Z",
    ],
  },
  "🕵": { paths: ["m21 21-4.3-4.3", "M9 8.5a2 2 0 1 1 2.5 1.9c-.5.2-.5.6-.5 1.1", "M11 14h.01"], circles: [[11, 11, 8]] },
  "📖": {
    paths: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"],
  },
  "🎓": { paths: ["M22 10 12 5 2 10l10 5 10-5Z", "M6 12v5c3 3 9 3 12 0v-5", "M22 10v6"] },
  "💼": {
    paths: [
      "M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z",
      "M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
      "M2 13h20",
    ],
  },
  "📊": { paths: ["M2 3h20", "M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3", "m7 21 5-5 5 5", "M8 12V9M12 12V7M16 12v-2"] },
  "🎯": { paths: [], circles: [[12, 12, 10], [12, 12, 6], [12, 12, 2]] },
  "📰": {
    paths: [
      "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2",
      "M18 14h-8M15 18h-5",
      "M10 6h8v4h-8Z",
    ],
  },

  // ----- Les icônes à choisir pour une nouvelle activité -----
  "✨": SPARKLES,
  "📚": {
    paths: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z", "M9 7h7"],
  },
  "🎬": { paths: ["M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", "M3 9h18", "M8 4l2 5M13 4l2 5"] },
  "🎵": { paths: ["M9 18V5l12-2v13"], circles: [[6, 18, 3], [18, 16, 3]] },
  "🍳": {
    paths: ["M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2", "M7 2v20", "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"],
  },
  "✈": {
    paths: [
      "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z",
    ],
  },
  "🧠": {
    paths: [
      "M12 5a3 3 0 1 0-6 .1 4 4 0 0 0-2.5 5.8 4 4 0 0 0 .6 6.6A4 4 0 1 0 12 18Z",
      "M12 5a3 3 0 1 1 6 .1 4 4 0 0 1 2.5 5.8 4 4 0 0 1-.6 6.6A4 4 0 1 1 12 18Z",
      "M12 5v13",
    ],
  },
  "🎨": {
    paths: [
      "M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.4 3.4A1.7 1.7 0 0 1 12 22Z",
      "M7.5 11h.01M10.5 7h.01M15 7.5h.01M17 11h.01",
    ],
  },
  "⚽": {
    paths: ["M12 7.5l4 2.9-1.5 4.6h-5L8 10.4Z", "M12 2v5.5M16 10.4l5.2-1.6M14.5 15l3 4.4M9.5 15l-3 4.4M8 10.4 2.8 8.8"],
    circles: [[12, 12, 10]],
  },
  "🌍": { paths: ["M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", "M2 12h20"], circles: [[12, 12, 10]] },
  "💡": {
    paths: [
      "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
      "M9 18h6",
      "M10 22h4",
    ],
  },
  "🗺": {
    paths: [
      "M14.1 4.6 9.9 2.4a2 2 0 0 0-1.8 0L3.6 4.7A1 1 0 0 0 3 5.6v14.6a1 1 0 0 0 1.4.9l4.5-2.3a2 2 0 0 1 1.8 0l4.2 2.2a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9V3.8a1 1 0 0 0-1.4-.9l-4.5 2.3a2 2 0 0 1-1.8 0Z",
      "M15 5.8v15M9 2.2v15",
    ],
  },
  "🤝": {
    paths: [
      "m11 17 2 2a1 1 0 1 0 3-3",
      "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.9l.5.3a2 2 0 0 0 1.4.2L21 4",
      "m21 3 1 11h-2",
      "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3",
      "M3 4h8",
    ],
  },
  "🔥": {
    paths: [
      "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.3 1.6 1.2 2.7 2.5 2.7Z",
    ],
  },

  // ----- Autres -----
  "🔴": {
    paths: ["M16.2 7.8a6 6 0 0 1 0 8.5M7.8 16.2a6 6 0 0 1 0-8.5M19.1 4.9a10 10 0 0 1 0 14.1M4.9 19.1a10 10 0 0 1 0-14.1"],
    circles: [[12, 12, 2]],
  },
};

/** Les icônes que l'admin peut choisir pour une activité (la valeur enregistrée = l'emoji). */
export const ACTIVITY_ICON_CHOICES = Object.keys(SHAPES).filter((key) => key !== "🔴");

/** "🗣️" et "🗣" sont le même emoji (le second sans le petit caractère invisible). */
const normalize = (emoji: string) => emoji.replace(/️/g, "").trim();

/** Le même emoji, sous la forme rangée dans la liste (pour savoir laquelle est choisie). */
export const activityIconKey = (emoji: string | null | undefined) => normalize(emoji ?? "");

export function ActivityIcon({ icon, className = "size-6" }: { icon: string | null | undefined; className?: string }) {
  const shape = SHAPES[normalize(icon ?? "💬")] ?? SPARKLES;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {shape.paths.map((d) => (
        <path key={d} d={d} />
      ))}
      {shape.circles?.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}
