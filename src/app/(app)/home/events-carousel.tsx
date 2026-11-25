"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Les cartes glissent de gauche à droite (et s'aimantent au centre).
 * La carte du centre est grande et nette ; les autres rapetissent un peu et pâlissent.
 * Les petits points en bas montrent où on est (on peut les toucher).
 */
export function EventsCarousel({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // La carte la plus proche du centre devient « active ».
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const center = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        Array.from(el.children).forEach((child, index) => {
          const card = child as HTMLElement;
          const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
          }
        });
        setActive(best);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = (index: number) => {
    const el = track.current;
    const card = el?.children[index] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  };

  if (items.length === 1) return <div>{items[0]}</div>;

  return (
    <div>
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 no-scrollbar"
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`w-[84%] shrink-0 snap-center transition-all duration-500 ease-out ${
              index === active ? "scale-100 opacity-100" : "scale-[0.92] opacity-60"
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Les points : où on est */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Event ${index + 1}`}
            aria-current={index === active}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === active ? "w-6 bg-gradient-to-r from-accent to-brand" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
