"use client";

import { useEffect, useId, useRef, useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";

// Champ "pays" : une liste déroulante avec recherche, drapeaux et clavier.
// Visuellement, il reprend le modèle des autres champs du formulaire.
export function CountrySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Le pays choisi (s'il vient bien de la liste).
  const selected = COUNTRIES.find((country) => country.name === value) ?? null;

  // Les pays qui correspondent à la recherche : ceux qui commencent par
  // le texte tapé arrivent en premier.
  const search = query.trim().toLowerCase();
  const matches: Country[] = search
    ? COUNTRIES.filter((country) => country.name.toLowerCase().includes(search)).sort(
        (a, b) =>
          Number(b.name.toLowerCase().startsWith(search)) -
          Number(a.name.toLowerCase().startsWith(search)),
      )
    : COUNTRIES;

  // Fermer en cliquant ailleurs.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  // À l'ouverture : le curseur va dans la recherche.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Garder l'élément survolé au clavier toujours visible.
  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, query]);

  function openList() {
    setQuery("");
    setActiveIndex(Math.max(0, COUNTRIES.findIndex((country) => country.name === value)));
    // Pas assez de place en dessous (barre du bas, bas de l'écran) ? On ouvre vers le haut.
    const box = rootRef.current?.getBoundingClientRect();
    if (box) {
      const below = window.innerHeight - box.bottom;
      setDropUp(below < 360 && box.top > below);
    }
    setOpen(true);
  }

  function choose(country: Country) {
    onChange(country.name);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + step;
        if (next < 0) return matches.length - 1;
        if (next >= matches.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Enter" && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex]);
    }
  }

  return (
    <div ref={rootRef} className="relative block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>

      {/* Le champ fermé */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
            event.preventDefault();
            openList();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-2xl border bg-zinc-50 px-3 py-2.5 text-left shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_6px_#ffffff] outline-none transition ${
          open ? "border-brand/40 ring-2 ring-brand/20" : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        {selected ? (
          <>
            <CodeChip code={selected.code} />
            <span className="min-w-0 flex-1 truncate text-zinc-900">{selected.name}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-zinc-400">
            {value || "Select your country"}
          </span>
        )}

        {/* Effacer le choix */}
        {value && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear country"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            className="shrink-0 rounded-full p-0.5 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-600"
          >
            <CloseIcon />
          </span>
        )}
        <ChevronIcon
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* La liste */}
      {open && (
        <div
          className={`anim-dropdown absolute left-0 right-0 z-30 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.3)] ${
            dropUp ? "bottom-full mb-2 origin-bottom" : "top-full mt-2"
          }`}
        >
          {/* La recherche */}
          <div className="border-b border-zinc-100 p-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <SearchIcon />
              </span>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search a country..."
                aria-controls={listId}
                aria-activedescendant={
                  matches[activeIndex] ? `${listId}-${activeIndex}` : undefined
                }
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          {/* Les pays */}
          {matches.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-400">No country found.</p>
          ) : (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Countries"
              className="max-h-60 overflow-y-auto overscroll-contain py-1"
            >
              {matches.map((country, index) => {
                const isSelected = country.name === value;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={country.code}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(country)}
                    className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isActive ? "bg-brand/5" : ""
                    } ${isSelected ? "font-semibold text-brand" : "text-zinc-700"}`}
                  >
                    <CodeChip code={country.code} active={isSelected} />
                    <span className="min-w-0 flex-1 truncate">{country.name}</span>
                    {isSelected && <CheckIcon />}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="border-t border-zinc-100 px-3 py-1.5 text-[11px] text-zinc-400">
            {matches.length} {matches.length === 1 ? "country" : "countries"}
          </p>
        </div>
      )}
    </div>
  );
}

/** La pastille du code pays (MG, FR...). Elle remplace le drapeau :
 *  tous les appareils l'affichent pareil, contrairement aux emojis. */
function CodeChip({ code, active = false }: { code: string; active?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex w-7 shrink-0 justify-center rounded-md px-1 py-0.5 font-mono text-[10px] font-bold tracking-wide ${
        active ? "bg-brand text-white" : "bg-cream text-brand"
      }`}
    >
      {code}
    </span>
  );
}

/* Petites icônes */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={`size-4 ${className ?? ""}`}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...iconProps} className="size-4" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps} className="size-4 shrink-0 text-brand">
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps} className="size-4">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
