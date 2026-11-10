// La photo du membre, ou ses initiales s'il n'en a pas.
// `size` : une classe Tailwind (size-8, size-10, size-12, size-16, size-24...).
// `online` : ajoute la pastille de présence (verte = en ligne).

/** Taille du texte des initiales et de la pastille, selon la taille de l'avatar. */
function scaleFor(size: string) {
  const units = Number(size.match(/size-(\d+)/)?.[1] ?? 12);
  if (units >= 24) return { text: "text-3xl", dot: "size-5 border-3" };
  if (units >= 16) return { text: "text-xl", dot: "size-4 border-2" };
  if (units >= 12) return { text: "text-base", dot: "size-3.5 border-2" };
  return { text: "text-xs", dot: "size-3 border-2" };
}

export function MemberAvatar({
  userId,
  name,
  hasPhoto,
  size = "size-12",
  online,
  className = "",
}: {
  userId: string;
  name: string;
  hasPhoto: boolean;
  size?: string;
  online?: boolean;
  className?: string;
}) {
  const scale = scaleFor(size);

  const picture = hasPhoto ? (
    // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
    <img
      src={`/api/profile/photo/${userId}`}
      alt=""
      className={`${size} shrink-0 rounded-full bg-blush object-cover ring-1 ring-black/5`}
    />
  ) : (
    <span
      aria-hidden
      className={`${size} ${scale.text} flex shrink-0 select-none items-center justify-center rounded-full bg-brand-100 font-display font-semibold text-brand ring-1 ring-brand-200/60`}
    >
      {initialsOf(name)}
    </span>
  );

  if (online === undefined) {
    return className ? <span className={`inline-flex ${className}`}>{picture}</span> : picture;
  }

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {picture}
      <span
        role="img"
        aria-label={online ? "Online" : "Offline"}
        className={`absolute bottom-0 right-0 rounded-full border-surface ${scale.dot} ${
          online ? "bg-success" : "bg-line-strong"
        }`}
      />
    </span>
  );
}

function initialsOf(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "?";
}
