import { eventIsLive } from "@/lib/event-live";
import { formatEventPrice } from "@/lib/event-price";

export type EventCoverData = {
  id: string;
  imageType: string | null;
  startsAt: Date | null;
  isPaid: boolean;
  price: number | null;
  currency: string | null;
  liveStartedAt: Date | null;
  liveEndedAt: Date | null;
};

const part = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", options).format(date);

/**
 * L'image d'un événement, bien visible (aucun texte dessus) :
 * le prix en haut à droite, « LIVE NOW » en haut à gauche pendant le direct,
 * et un bloc date comme un petit calendrier en bas à droite.
 * Sert sur la page Events et dans le carrousel de l'accueil.
 */
export function EventCover({ event, className = "h-44" }: { event: EventCoverData; className?: string }) {
  return (
    <div className={`group relative overflow-hidden ${className}`}>
      {event.imageType ? (
        // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
        <img
          src={`/api/event/image/${event.id}`}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#2e3192,#7a082e_55%,#9c0b3b)]" />
      )}
      {/* Un voile très léger en bas : l'image reste bien visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {eventIsLive(event) && (
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          <span className="relative flex size-2">
            <span className="anim-ping absolute inset-0 rounded-full bg-white" />
            <span className="relative size-2 rounded-full bg-white" />
          </span>
          LIVE NOW
        </span>
      )}

      {/* Le bloc date, comme un petit calendrier posé sur l'image */}
      {event.startsAt && (
        <span className="absolute bottom-3 right-3 flex w-[4.25rem] flex-col items-center rounded-2xl bg-[#1a1240]/75 py-1.5 text-white shadow-xl ring-1 ring-white/25 backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent">{part(event.startsAt, { weekday: "short" })}</span>
          <span className="font-display text-2xl font-extrabold leading-none">{part(event.startsAt, { day: "2-digit" })}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/75">{part(event.startsAt, { month: "short" })}</span>
          <span className="mt-1 rounded-full bg-white/15 px-1.5 text-[10px] font-bold tabular-nums">
            {part(event.startsAt, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
      )}

      {/* Le prix : gratuit ou payant */}
      <span
        className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-lg ${
          event.isPaid ? "bg-accent text-navy" : "bg-emerald-500 text-white"
        }`}
      >
        {formatEventPrice(event)}
      </span>
    </div>
  );
}
