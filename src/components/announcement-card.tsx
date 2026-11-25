import Link from "next/link";

/**
 * Une annonce du club : dégradé bordeaux → orange, mégaphone qui bouge, reflet qui passe,
 * l'étiquette « Announcement » et, s'il y a un lien, un bouton clair pour l'ouvrir.
 * Sert sur la page Events (les annonces) et sur la page Notifications.
 */
export function AnnouncementCard({
  title,
  body,
  dateLabel,
  fresh = false,
  href,
}: {
  title: string;
  body?: string | null;
  /** La date déjà écrite (ex : « 09 Nov »). */
  dateLabel: string;
  /** Nouvelle / pas encore lue : badge « New », mégaphone animé, reflet. */
  fresh?: boolean;
  href?: string | null;
}) {
  const inside = (
    <>
      {/* Le décor : lueurs, cercle, étoiles, reflet */}
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-accent/45 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-navy/60 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -right-6 bottom-3 size-24 rounded-full border-[10px] border-white/[0.07]" />
      <span aria-hidden className="anim-twinkle pointer-events-none absolute right-16 top-4 size-2 rounded-full bg-cream/70" />
      <span aria-hidden className="anim-twinkle pointer-events-none absolute right-8 top-10 size-1.5 rounded-full bg-white/70 [animation-delay:0.8s]" />
      {fresh && <span aria-hidden className="anim-shine pointer-events-none absolute inset-0" />}

      <span className="relative flex items-start gap-3.5">
        {/* Le mégaphone */}
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-brand shadow-lg shadow-black/25">
          <span className={fresh ? "anim-wiggle" : "inline-flex"}>
            <MegaphoneIcon />
          </span>
          {fresh && (
            <span aria-hidden className="absolute -right-1 -top-1 flex size-3.5">
              <span className="anim-ping absolute inset-0 rounded-full bg-accent" />
              <span className="relative size-3.5 rounded-full border-2 border-white bg-accent" />
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Announcement
            </span>
            {fresh && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                New
              </span>
            )}
          </span>
          <span className="mt-2 block break-words font-display text-[17px] font-extrabold leading-snug text-white">
            {title}
          </span>
          {body && <span className="mt-1.5 block text-[13px] leading-relaxed text-white/85">{body}</span>}

          <span className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-white/75">
            {/* eslint-disable-next-line @next/next/no-img-element -- petit logo local */}
            <img src="/icons/icon-192.png" alt="" className="size-5 rounded-full ring-1 ring-white/40" />
            Tomes Club
            <span aria-hidden>·</span>
            {dateLabel}
            {href && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-brand shadow-md transition group-hover:translate-x-0.5">
                Open
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            )}
          </span>
        </span>
      </span>
    </>
  );

  const shell = `group relative block overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#7a082e_0%,#9c0b3b_45%,#d9534f_80%,#f7944a_115%)] p-4 shadow-[0_18px_40px_-18px_rgba(156,11,59,0.9)] ring-1 ${
    fresh ? "ring-accent/60" : "ring-white/10"
  }`;

  return href ? (
    <Link href={href} className={`${shell} transition hover:-translate-y-0.5`}>
      {inside}
    </Link>
  ) : (
    <div className={shell}>{inside}</div>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}
