"use client";

import { useRef, useState, type ReactNode } from "react";
import { CountrySelect } from "@/components/country-select";
import type { ProfileFormInitial } from "@/components/profile-form";
import {
  ENGLISH_LEVELS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  MAX_PHOTO_BYTES,
  OCCUPATIONS,
  PHOTO_TYPES,
  USER_TYPES,
} from "@/lib/onboarding-options";
import { saveProfileInline } from "./edit/actions";

// La fenêtre "Edit profile" en forme de carte de membre : la fente, le bandeau diagonal,
// la photo ronde, puis des lignes "ÉTIQUETTE · valeur" qu'on modifie directement.

export function EditProfileCard({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProfileFormInitial;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [userType, setUserType] = useState(initial.userType || "member");
  const [englishLevel, setEnglishLevel] = useState(initial.englishLevel);
  const [phone, setPhone] = useState(initial.phone);
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [occupations, setOccupations] = useState<Record<string, string>>(
    Object.fromEntries(initial.occupations.map((entry) => [entry.kind, entry.detail])),
  );
  const [languages, setLanguages] = useState(initial.languages);
  const [interests, setInterests] = useState(initial.interests);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photoUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";

  function choosePhoto(file: File | undefined) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) return setError("The photo must be a JPG, PNG or WebP image.");
    if (file.size > MAX_PHOTO_BYTES) return setError("The photo is too big (3 MB maximum).");
    setError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function save() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) return setError("Please write your first and last name.");
    if (!birthDate) return setError("Please give your date of birth.");
    if (!country) return setError("Please choose your country.");
    if (!userType) return setError("Please choose who you are.");
    if (Object.keys(occupations).length === 0) return setError("Please choose at least one occupation (Does).");
    if (languages.length === 0) return setError("Please add at least one language you speak.");
    if (!englishLevel) return setError("Please choose your English level.");

    // Les mêmes champs que le formulaire d'accueil (même vérification côté serveur).
    const data = new FormData();
    data.set("firstName", firstName);
    data.set("lastName", lastName);
    data.set("birthDate", birthDate);
    data.set("country", country);
    data.set("city", city);
    data.set("phone", phone);
    data.set("userType", userType);
    for (const [kind, detail] of Object.entries(occupations)) {
      data.append("occupations", kind);
      data.set(`occupationDetail_${kind}`, detail);
    }
    for (const language of languages) data.append("languages", language);
    data.set("englishLevel", englishLevel);
    for (const interest of interests) data.append("interests", interest);
    if (photoFile) data.set("photo", photoFile);

    setPending(true);
    const result = await saveProfileInline({ error: null }, data);
    setPending(false);
    if (result.error) return setError(result.error);
    onSaved();
  }

  return (
    <div className="anim-pop relative flex max-h-[92dvh] w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.75rem] bg-white text-zinc-900 shadow-[0_26px_55px_-18px_rgba(0,0,0,0.65)]">
      <div className="min-h-0 overflow-y-auto pb-4">
        {/* La fente du badge */}
        <div className="relative z-10 pt-4">
          <div className="mx-auto h-2.5 w-16 rounded-full bg-zinc-200 shadow-inner" />
        </div>

        {/* Le bandeau diagonal aux couleurs du club */}
        <svg aria-hidden viewBox="0 0 320 130" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-32 w-full">
          <polygon points="0,0 320,0 320,52 0,118" fill="#9c0b3b" />
          <polygon points="0,0 320,0 320,30 0,86" fill="#2e3192" opacity="0.92" />
          <polygon points="210,0 320,0 320,66" fill="#f7944a" />
        </svg>

        {/* Fermer (à la place du crayon) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full bg-white text-navy shadow-lg transition hover:scale-110 hover:text-brand"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden className="size-4">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {/* La photo (un clic pour la changer) */}
        <div className="relative z-10 mt-8 flex justify-center">
          <input
            ref={photoInput}
            type="file"
            accept={PHOTO_TYPES.join(",")}
            hidden
            onChange={(event) => choosePhoto(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            aria-label="Change your photo"
            className="group relative rounded-full bg-white p-1.5 shadow-lg"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou photo privée de l'API
              <img src={photoPreview} alt="" className="size-24 rounded-full object-cover" />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-full bg-[#e4d6d3] text-lg font-bold text-brand">
                {initials}
              </span>
            )}
            <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#c2185b] text-white shadow-md ring-[3px] ring-white transition group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
                <path d="M4 7h3l2-2.5h6L17 7h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 7Z" />
                <circle cx="12" cy="12.5" r="3.5" />
              </svg>
            </span>
          </button>
        </div>

        {/* Le nom, le type, le niveau : comme sur la carte */}
        <div className="relative z-10 mt-3 space-y-2.5 px-5 text-center">
          <div className="flex gap-2">
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First name"
              aria-label="First name"
              className={`${nameField} text-right`}
            />
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Last name"
              aria-label="Last name"
              className={`${nameField} text-left`}
            />
          </div>

          <div className="flex justify-center gap-1" role="radiogroup" aria-label="You are">
            {USER_TYPES.map((type) => (
              <Pill key={type.value} on={userType === type.value} tone="navy" onClick={() => setUserType(type.value)}>
                {type.label}
              </Pill>
            ))}
          </div>
          {userType !== "member" && userType !== initial.userType && (
            <p className="text-[11px] text-amber-600">The admin will check this request.</p>
          )}

          <div className="flex flex-wrap justify-center gap-1" role="radiogroup" aria-label="English level">
            {ENGLISH_LEVELS.map((level) => (
              <Pill key={level.value} on={englishLevel === level.value} tone="accent" onClick={() => setEnglishLevel(level.value)}>
                {level.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Les lignes du badge */}
        <dl className="relative z-10 mt-4 space-y-3 border-t border-zinc-100 px-5 pt-4">
          <Row label="Phone">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+261 34 00 000 00" className={lineField} />
          </Row>
          <Row label="Born">
            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={lineField}
            />
          </Row>
          <Row label="Lives in">
            <div className="space-y-2">
              <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className={lineField} />
              <div className="[&_label>span:first-child]:sr-only">
                <CountrySelect label="Country" value={country} onChange={setCountry} />
              </div>
            </div>
          </Row>
          <Row label="Does">
            <div className="flex flex-wrap gap-1">
              {OCCUPATIONS.map((occupation) => {
                const on = occupation.kind in occupations;
                return (
                  <Pill
                    key={occupation.kind}
                    on={on}
                    tone="brand"
                    onClick={() =>
                      setOccupations((current) => {
                        const next = { ...current };
                        if (on) delete next[occupation.kind];
                        else next[occupation.kind] = "";
                        return next;
                      })
                    }
                  >
                    {occupation.label}
                  </Pill>
                );
              })}
            </div>
            {OCCUPATIONS.filter((occupation) => occupation.kind in occupations).map((occupation) => (
              <input
                key={occupation.kind}
                value={occupations[occupation.kind]}
                onChange={(event) =>
                  setOccupations((current) => ({ ...current, [occupation.kind]: event.target.value }))
                }
                placeholder={`${occupation.label}: ${occupation.placeholder}`}
                aria-label={occupation.detailLabel}
                className={`${lineField} mt-1.5`}
              />
            ))}
          </Row>
          <Row label="Speaks">
            <Chips options={LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} addLabel="Add a language" />
          </Row>
          <Row label="Likes">
            <Chips options={INTEREST_OPTIONS} selected={interests} onChange={setInterests} addLabel="Add an interest" />
          </Row>
        </dl>

        {error && (
          <p aria-live="polite" className="mx-5 mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}
      </div>

      {/* Les boutons */}
      <div className="flex gap-2 border-t border-zinc-100 bg-white px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="flex-1 rounded-full py-2.5 text-sm font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-navy"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-[1.4] rounded-full bg-gradient-to-r from-brand to-[#c2185b] py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(156,11,59,0.8)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

const nameField =
  "min-w-0 flex-1 border-b-2 border-transparent bg-transparent pb-0.5 font-display text-xl font-bold text-navy outline-none transition placeholder:text-zinc-300 hover:border-zinc-200 focus:border-brand";

const lineField =
  "w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-brand/50 focus:ring-2 focus:ring-brand/10";

/** Une ligne du badge : l'étiquette à gauche, la valeur (modifiable) à droite. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-16 shrink-0 pt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

/** Une petite pastille à choisir (couleurs de la carte). */
function Pill({
  on,
  tone,
  onClick,
  children,
}: {
  on: boolean;
  tone: "navy" | "accent" | "brand";
  onClick: () => void;
  children: ReactNode;
}) {
  const active = { navy: "bg-navy text-white", accent: "bg-accent text-white", brand: "bg-brand text-white" }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
        on ? `${active} shadow-sm` : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

/** Des pastilles à cocher + un petit champ pour en ajouter une. */
function Chips({
  options,
  selected,
  onChange,
  addLabel,
}: {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  addLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const all = [...options, ...selected.filter((value) => !options.includes(value))];

  function add() {
    const value = draft.trim();
    if (value && !selected.includes(value)) onChange([...selected, value]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {all.map((option) => {
          const on = selected.includes(option);
          return (
            <Pill
              key={option}
              on={on}
              tone="brand"
              onClick={() => onChange(on ? selected.filter((value) => value !== option) : [...selected, option])}
            >
              {option}
            </Pill>
          );
        })}
      </div>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={`+ ${addLabel}`}
        aria-label={addLabel}
        className="mt-1.5 w-full rounded-lg border border-dashed border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-solid focus:border-brand/50"
      />
    </div>
  );
}
