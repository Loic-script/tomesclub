"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { authClient } from "@/lib/auth-client";
import {
  ENGLISH_LEVELS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  MAX_PHOTO_BYTES,
  OCCUPATIONS,
  PHOTO_TYPES,
  type OccupationKind,
} from "@/lib/onboarding-options";

// Le formulaire de fiche en 4 étapes. Deux usages :
//  - mode "onboarding" : juste après la première connexion ;
//  - mode "edit" : modifier son profil depuis l'application.

export type ProfileFormState = { error: string | null };

export type ProfileFormInitial = {
  firstName: string;
  lastName: string;
  birthDate: string; // "aaaa-mm-jj" ou ""
  country: string;
  city: string;
  phone: string;
  occupations: { kind: string; detail: string }[];
  languages: string[];
  englishLevel: string;
  interests: string[];
  /** L'adresse de la photo déjà enregistrée (mode edit), sinon null. */
  photoUrl: string | null;
};

const STEPS = [
  { title: "About you", subtitle: "Tell us who you are. Only your name is required." },
  { title: "What you do", subtitle: "Check everything that fits you — or skip this step." },
  { title: "English & interests", subtitle: "So your classes fit your level." },
  { title: "Your photo", subtitle: "Last step! Help the club recognize you." },
] as const;

const initialState: ProfileFormState = { error: null };
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

type OccupationState = Record<OccupationKind, { on: boolean; detail: string }>;

export function ProfileForm({
  mode,
  initial,
  action,
}: {
  mode: "onboarding" | "edit";
  initial: ProfileFormInitial;
  action: (prevState: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  // --- Étape 1 ---
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [phone, setPhone] = useState(initial.phone);

  // --- Étape 2 ---
  const [occupations, setOccupations] = useState<OccupationState>(
    () =>
      Object.fromEntries(
        OCCUPATIONS.map((occupation) => {
          const saved = initial.occupations.find((entry) => entry.kind === occupation.kind);
          return [occupation.kind, { on: Boolean(saved), detail: saved?.detail ?? "" }];
        }),
      ) as OccupationState,
  );

  // --- Étape 3 ---
  const [languages, setLanguages] = useState<string[]>(initial.languages);
  const [languageDraft, setLanguageDraft] = useState("");
  const [englishLevel, setEnglishLevel] = useState(initial.englishLevel);
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const [interestDraft, setInterestDraft] = useState("");

  // --- Étape 4 ---
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photoUrl);

  function validateStep(index: number): string | null {
    if (index === 0 && (!firstName.trim() || !lastName.trim())) {
      return "Please fill in your first and last name.";
    }
    if (index === 1) {
      for (const occupation of OCCUPATIONS) {
        const value = occupations[occupation.kind];
        if (value.on && !value.detail.trim()) {
          return `Please add a detail for "${occupation.label}".`;
        }
      }
    }
    if (index === 2 && !englishLevel) {
      return "Please choose your English level.";
    }
    return null;
  }

  function goNext() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  function choosePhoto(file: File | null) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setStepError("The photo must be a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setStepError("The photo is too big (3 MB maximum).");
      return;
    }
    setStepError(null);
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function submit() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("birthDate", birthDate);
    formData.set("country", country);
    formData.set("city", city);
    formData.set("phone", phone);
    for (const occupation of OCCUPATIONS) {
      const value = occupations[occupation.kind];
      if (!value.on) continue;
      formData.append("occupations", occupation.kind);
      formData.set(`occupationDetail_${occupation.kind}`, value.detail);
    }
    // Les listes + ce qui reste tapé dans les champs "Add"
    for (const language of [...languages, languageDraft]) {
      if (language.trim()) formData.append("languages", language);
    }
    formData.set("englishLevel", englishLevel);
    for (const interest of [...interests, interestDraft]) {
      if (interest.trim()) formData.append("interests", interest);
    }
    if (photoFile) formData.set("photo", photoFile);

    startTransition(() => formAction(formData));
  }

  const isLastStep = step === STEPS.length - 1;
  const error = stepError ?? state.error;
  const finishLabel =
    mode === "edit" ? "Save changes" : photoFile ? "Finish" : "Finish without photo";

  return (
    <div className="anim-rise w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 sm:p-10">
      {/* ----- En-tête : logo + avancement ----- */}
      <header className="mb-8">
        <div className="anim-rise flex items-center gap-4" style={delay(100)}>
          <Image src="/logo.png" alt="" width={64} height={64} className="rounded-full drop-shadow-md" />
          <div>
            <p className="font-display text-2xl font-bold leading-tight text-navy">
              {mode === "edit" ? "Edit profile" : "Tomes Club"}
            </p>
            <p className="text-sm text-zinc-500">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          {mode === "onboarding" ? (
            <BackToSignIn />
          ) : (
            <Link
              href="/profile"
              className="ml-auto self-start text-sm font-medium text-zinc-400 transition hover:text-brand"
            >
              ← Profile
            </Link>
          )}
        </div>

        {/* Barre d'avancement : une part par étape */}
        <div className="anim-rise mt-5 flex gap-2" style={delay(200)}>
          {STEPS.map((item, index) => (
            <div key={item.title} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index < step ? "bg-accent" : index === step ? "bg-brand" : "bg-zinc-200"
                }`}
              />
              <p
                className={`mt-1.5 hidden text-[11px] font-medium sm:block ${
                  index === step ? "text-brand" : "text-zinc-400"
                }`}
              >
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* ----- Le contenu de l'étape (re-animé à chaque changement) ----- */}
      <div key={step} className="anim-rise">
        <h1 className="font-display text-2xl font-bold text-navy">{STEPS[step].title}</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-600">{STEPS[step].subtitle}</p>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name *" value={firstName} onChange={setFirstName} autoComplete="given-name" />
            <TextField label="Last name *" value={lastName} onChange={setLastName} autoComplete="family-name" />
            <TextField label="Date of birth" type="date" value={birthDate} onChange={setBirthDate} max={new Date().toISOString().slice(0, 10)} />
            <TextField label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="+261 34 00 000 00" autoComplete="tel" />
            <TextField label="Country" value={country} onChange={setCountry} placeholder="e.g. Madagascar" autoComplete="country-name" />
            <TextField label="City (where you live)" value={city} onChange={setCity} placeholder="e.g. Antananarivo" autoComplete="address-level2" />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {OCCUPATIONS.map((occupation) => {
              const value = occupations[occupation.kind];
              return (
                <div
                  key={occupation.kind}
                  className={`rounded-2xl border p-4 transition-colors duration-300 ${
                    value.on ? "border-brand bg-brand/5" : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={value.on}
                      onChange={() =>
                        setOccupations((current) => ({
                          ...current,
                          [occupation.kind]: { ...current[occupation.kind], on: !value.on },
                        }))
                      }
                      className="size-4 accent-brand"
                    />
                    <span className="font-semibold text-zinc-900">{occupation.label}</span>
                  </label>

                  {/* Le détail se déplie quand la case est cochée */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      value.on ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <TextField
                        label={`${occupation.detailLabel} *`}
                        value={value.detail}
                        onChange={(detail) =>
                          setOccupations((current) => ({
                            ...current,
                            [occupation.kind]: { ...current[occupation.kind], detail },
                          }))
                        }
                        placeholder={occupation.placeholder}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <ChipPicker
              label="Languages you speak"
              options={LANGUAGE_OPTIONS}
              selected={languages}
              onToggle={(value) => setLanguages((current) => toggleItem(current, value))}
              draft={languageDraft}
              onDraft={setLanguageDraft}
              addPlaceholder="Add another language..."
            />

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Your English level *</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ENGLISH_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setEnglishLevel(level.value)}
                    className={`rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                      englishLevel === level.value
                        ? "border-brand bg-brand/5 shadow-sm ring-1 ring-brand"
                        : "border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm"
                    }`}
                  >
                    <span className="block font-semibold text-zinc-900">{level.label}</span>
                    <span className="block text-xs text-zinc-500">{level.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <ChipPicker
              label="Your interests (pick as many as you like)"
              options={INTEREST_OPTIONS}
              selected={interests}
              onToggle={(value) => setInterests((current) => toggleItem(current, value))}
              draft={interestDraft}
              onDraft={setInterestDraft}
              addPlaceholder="Add your own..."
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <input
              ref={photoInputRef}
              type="file"
              accept={PHOTO_TYPES.join(",")}
              className="hidden"
              onChange={(event) => choosePhoto(event.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className={`anim-pop group relative flex size-44 items-center justify-center overflow-hidden rounded-full transition-all duration-300 hover:scale-105 ${
                photoPreview
                  ? "shadow-xl ring-4 ring-accent/60"
                  : "border-2 border-dashed border-zinc-300 bg-cream/40 hover:border-brand"
              }`}
              style={delay(150)}
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou photo privée de l'API
                <img src={photoPreview} alt="Your photo" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-zinc-500 transition-colors group-hover:text-brand">
                  <CameraIcon />
                  <span className="text-sm font-medium">Choose a photo</span>
                </span>
              )}
            </button>

            <p className="text-sm text-zinc-600">
              {photoPreview ? (
                <>
                  {photoFile ? "Looking good! You can" : "Your current photo. You can"}{" "}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="font-semibold text-brand hover:underline"
                  >
                    change it
                  </button>{" "}
                  if you want.
                </>
              ) : (
                "JPG, PNG or WebP, 3 MB maximum. You can also finish without a photo."
              )}
            </p>
          </div>
        )}
      </div>

      {/* ----- Erreur + navigation ----- */}
      <p aria-live="polite" className="mt-4 min-h-5 text-sm text-red-600">
        {error}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0 || pending}
          className="rounded-full px-5 py-2.5 font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:invisible"
        >
          ← Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="rounded-full bg-brand px-7 py-2.5 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : finishLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-brand px-7 py-2.5 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Petits morceaux réutilisés ---------- */

/** Retour à la page d'authentification : on déconnecte d'abord, sinon on reviendrait ici. */
function BackToSignIn() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="ml-auto self-start text-sm font-medium text-zinc-400 transition hover:text-brand disabled:opacity-60"
    >
      {pending ? "Please wait..." : "← Back to sign in"}
    </button>
  );
}

function toggleItem(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <input
        {...inputProps}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-zinc-900 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_6px_#ffffff] outline-none transition placeholder:text-zinc-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

function ChipPicker({
  label,
  options,
  selected,
  onToggle,
  draft,
  onDraft,
  addPlaceholder,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  draft: string;
  onDraft: (value: string) => void;
  addPlaceholder: string;
}) {
  // Les choix ajoutés à la main apparaissent aussi comme des pastilles.
  const custom = selected.filter((value) => !options.includes(value));

  function addDraft() {
    const value = draft.trim();
    if (!value) return;
    if (!selected.includes(value)) onToggle(value);
    onDraft("");
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {[...options, ...custom].map((option) => {
          const isOn = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                isOn
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-zinc-300 text-zinc-700 hover:-translate-y-0.5 hover:border-brand hover:text-brand"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
          placeholder={addPlaceholder}
          className="w-full max-w-60 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-sm text-zinc-900 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_#ffffff] outline-none transition placeholder:text-zinc-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={addDraft}
          className="rounded-xl border border-zinc-200 px-3 text-sm font-semibold text-zinc-600 transition hover:border-brand hover:text-brand"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h3l2-2.5h6L17 7h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 7Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}
