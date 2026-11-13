"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { CountrySelect } from "@/components/country-select";
import { authClient } from "@/lib/auth-client";
import {
  ENGLISH_LEVELS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  MAX_PHOTO_BYTES,
  OCCUPATIONS,
  PHOTO_TYPES,
  USER_TYPES,
  type OccupationKind,
} from "@/lib/onboarding-options";

// Le formulaire de fiche en 4 étapes. Deux usages :
//  - mode "onboarding" : juste après la première connexion ;
//  - mode "edit" : modifier son profil depuis l'application.

export type ProfileFormState = { error: string | null; saved?: boolean };

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
  /** member | leader | teacher : le type confirmé, ou la demande en attente. */
  userType: string;
  /** true = Leader / Teacher pas encore validé par l'admin. */
  userTypePending: boolean;
  /** L'adresse de la photo déjà enregistrée (mode edit), sinon null. */
  photoUrl: string | null;
};

const STEPS = [
  {
    title: "About you",
    subtitle: "Tell us who you are. Fields with * are required.",
  },
  {
    title: "What you do",
    subtitle: "Check at least one. The details are optional.",
  },
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
  onClose,
  onSaved,
}: {
  /** Mode fenêtre (Edit profile) : fermer la fenêtre */
  onClose?: () => void;
  /** Mode fenêtre : appelé quand l'enregistrement a réussi */
  onSaved?: () => void;
  mode: "onboarding" | "edit";
  initial: ProfileFormInitial;
  action: (
    prevState: ProfileFormState,
    formData: FormData,
  ) => Promise<ProfileFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const inModal = mode === "edit" && Boolean(onClose);
  useEffect(() => {
    if (state.saved) onSaved?.();
  }, [state.saved, onSaved]);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  // --- Étape 1 ---
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [phone, setPhone] = useState(initial.phone);
  // Rien de choisi au départ (inscription) : le membre doit choisir.
  const [userType, setUserType] = useState(initial.userType);

  // --- Étape 2 ---
  const [occupations, setOccupations] = useState<OccupationState>(
    () =>
      Object.fromEntries(
        OCCUPATIONS.map((occupation) => {
          const saved = initial.occupations.find(
            (entry) => entry.kind === occupation.kind,
          );
          return [
            occupation.kind,
            { on: Boolean(saved), detail: saved?.detail ?? "" },
          ];
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initial.photoUrl,
  );

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!firstName.trim() || !lastName.trim()) return "Please fill in your first and last name.";
      if (!birthDate) return "Please give your date of birth.";
      if (!country) return "Please choose your country.";
      if (!userType) return "Please choose who you are: Member, Leader or Teacher.";
    }
    // Au moins une occupation cochée (le détail est facultatif)
    if (index === 1 && !OCCUPATIONS.some((occupation) => occupations[occupation.kind].on)) {
      return "Please check at least one.";
    }
    if (index === 2) {
      if (![...languages, languageDraft].some((language) => language.trim())) {
        return "Please add at least one language you speak.";
      }
      if (!englishLevel) return "Please choose your English level.";
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
    // En modification on peut enregistrer depuis n'importe quelle étape : on les vérifie toutes.
    const toCheck = mode === "edit" ? STEPS.map((_, index) => index) : [step];
    for (const index of toCheck) {
      const error = validateStep(index);
      if (error) {
        setStep(index);
        setStepError(error);
        return;
      }
    }
    setStepError(null);

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("birthDate", birthDate);
    formData.set("country", country);
    formData.set("city", city);
    formData.set("phone", phone);
    formData.set("userType", userType);
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
    mode === "edit"
      ? "Save changes"
      : photoFile
        ? "Finish"
        : "Finish without photo";

  return (
    <div
      className={`anim-rise relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 ${
        inModal ? "flex max-h-[92dvh] flex-col" : ""
      }`}
    >
      {/* En fenêtre : le bandeau diagonal de la carte de membre, le titre et le bouton fermer */}
      {inModal && (
        <div className="relative h-24 shrink-0">
          <svg aria-hidden viewBox="0 0 320 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <polygon points="0,0 320,0 320,48 0,96" fill="#9c0b3b" />
            <polygon points="0,0 320,0 320,26 0,70" fill="#2e3192" opacity="0.92" />
            <polygon points="215,0 320,0 320,58" fill="#f7944a" />
          </svg>
          <p className="relative px-6 pt-5 font-display text-2xl font-extrabold text-white drop-shadow sm:px-8">Edit profile</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white text-navy shadow-lg transition hover:scale-105 hover:text-brand"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden className="size-4">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
      {/* Touches de couleur très douces dans le blanc (comme la page de connexion) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-cream/80 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 size-56 rounded-full bg-accent/10 blur-3xl"
      />

      <div className={`relative ${inModal ? "overflow-y-auto px-6 pb-6 pt-1 sm:px-8" : "p-6 sm:p-10"}`}>
        {/* ----- En-tête : logo + titre + étape ----- */}
        <header className="mb-7">
          <div className={`anim-rise flex items-center gap-4 ${inModal ? "hidden" : ""}`} style={delay(100)}>
            <span className="relative shrink-0">
              <span
                aria-hidden
                className="anim-halo absolute -inset-1.5 rounded-full bg-accent/35 blur-md"
              />
              <Image
                src="/logo.png"
                alt=""
                width={52}
                height={52}
                className="relative rounded-full drop-shadow-md"
              />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl font-bold leading-tight text-navy">
                {mode === "edit" ? "Edit profile" : "Welcome to Tomes Club"}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand/[0.07] px-2.5 py-0.5 text-xs font-semibold text-brand">
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

          {/* Les étapes : des cercles numérotés reliés par une ligne */}
          <ol className={`anim-rise flex items-start ${inModal ? "mt-1" : "mt-7"}`} style={delay(200)}>
            {STEPS.map((item, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <li
                  key={item.title}
                  className="relative flex flex-1 flex-col items-center text-center"
                >
                  {/* La ligne vers l'étape suivante */}
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2 bg-zinc-200"
                    >
                      <span
                        className={`block h-full rounded-full bg-gradient-to-r from-accent to-brand transition-all duration-500 ${
                          done ? "w-full" : "w-0"
                        }`}
                      />
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={mode !== "edit"}
                    onClick={() => {
                      setStepError(null);
                      setStep(index);
                    }}
                    aria-label={item.title}
                    aria-current={current ? "step" : undefined}
                    className={`relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 enabled:hover:scale-110 ${
                      done
                        ? "bg-accent text-white shadow-md shadow-accent/30"
                        : current
                          ? "bg-brand text-white shadow-lg shadow-brand/30 ring-4 ring-brand/15"
                          : "bg-white text-zinc-400 ring-1 ring-zinc-200"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </button>
                  <span
                    className={`mt-2 hidden text-[11px] font-semibold sm:block ${
                      current
                        ? "text-brand"
                        : done
                          ? "text-zinc-600"
                          : "text-zinc-400"
                    }`}
                  >
                    {item.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </header>

        <div
          aria-hidden
          className={`h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent ${inModal ? "mb-5 mt-5" : "mb-7"}`}
        />

        {/* ----- Le contenu de l'étape (re-animé à chaque changement) ----- */}
        <div key={step} className="anim-rise">
          <h1 className="font-display text-[1.65rem] font-bold leading-tight text-navy">
            {STEPS[step].title}
          </h1>
          <p className="mb-6 mt-1 text-sm text-zinc-500">
            {STEPS[step].subtitle}
          </p>

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First name *"
                value={firstName}
                onChange={setFirstName}
                autoComplete="given-name"
              />
              <TextField
                label="Last name *"
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
              />
              <TextField
                label="Date of birth *"
                type="date"
                value={birthDate}
                onChange={setBirthDate}
                max={new Date().toISOString().slice(0, 10)}
              />
              <TextField
                label="Phone"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="+261 34 00 000 00"
                autoComplete="tel"
              />
              <CountrySelect
                label="Country *"
                value={country}
                onChange={setCountry}
              />
              <TextField
                label="City (where you live)"
                value={city}
                onChange={setCity}
                placeholder="e.g. Antananarivo"
                autoComplete="address-level2"
              />

              {/* Le type d'utilisateur : Leader et Teacher doivent être validés par le coach */}
              <div className="sm:col-span-2">
                <p className="mb-1.5 block text-xs font-semibold text-zinc-600">
                  You are *
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {USER_TYPES.map((type) => (
                    <ChoiceCard
                      key={type.value}
                      selected={userType === type.value}
                      onClick={() => setUserType(type.value)}
                      title={type.label}
                      hint={type.hint}
                    />
                  ))}
                </div>
                {userType !== "member" && (
                  <p className="anim-dropdown mt-2.5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
                    <span aria-hidden>⏳</span>
                    {initial.userTypePending || userType !== initial.userType
                      ? "The admin will check your request. You stay a Member until it is accepted."
                      : "Confirmed by the admin."}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {OCCUPATIONS.map((occupation) => {
                const value = occupations[occupation.kind];
                return (
                  <div
                    key={occupation.kind}
                    className={`rounded-2xl border p-4 transition-all duration-300 ${
                      value.on
                        ? "border-brand/40 bg-gradient-to-br from-brand/[0.05] to-accent/[0.06] shadow-sm ring-2 ring-brand/10"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={value.on}
                        onChange={() =>
                          setOccupations((current) => ({
                            ...current,
                            [occupation.kind]: {
                              ...current[occupation.kind],
                              on: !value.on,
                            },
                          }))
                        }
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-bold transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20 ${
                          value.on
                            ? "bg-gradient-to-br from-brand to-[#c2185b] text-white shadow-sm"
                            : "bg-white ring-1 ring-zinc-300"
                        }`}
                      >
                        {value.on ? "✓" : ""}
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {occupation.label}
                      </span>
                    </label>

                    {/* Le détail se déplie quand la case est cochée */}
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        value.on
                          ? "mt-3 grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <TextField
                          label={occupation.detailLabel}
                          value={value.detail}
                          onChange={(detail) =>
                            setOccupations((current) => ({
                              ...current,
                              [occupation.kind]: {
                                ...current[occupation.kind],
                                detail,
                              },
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
                label="Languages you speak *"
                options={LANGUAGE_OPTIONS}
                selected={languages}
                onToggle={(value) =>
                  setLanguages((current) => toggleItem(current, value))
                }
                draft={languageDraft}
                onDraft={setLanguageDraft}
                addPlaceholder="Add another language..."
              />

              <div>
                <p className="mb-1.5 block text-xs font-semibold text-zinc-600">
                  Your English level *
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ENGLISH_LEVELS.map((level, index) => (
                    <ChoiceCard
                      key={level.value}
                      selected={englishLevel === level.value}
                      onClick={() => setEnglishLevel(level.value)}
                      title={level.label}
                      hint={level.hint}
                      meter={index + 1}
                    />
                  ))}
                </div>
              </div>

              <ChipPicker
                label="Your interests (pick as many as you like)"
                options={INTEREST_OPTIONS}
                selected={interests}
                onToggle={(value) =>
                  setInterests((current) => toggleItem(current, value))
                }
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
                onChange={(event) =>
                  choosePhoto(event.target.files?.[0] ?? null)
                }
              />

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className={`anim-pop group relative flex size-44 items-center justify-center rounded-full transition-all duration-300 hover:scale-[1.03] ${
                  photoPreview
                    ? "bg-gradient-to-br from-accent to-brand p-1 shadow-[0_20px_40px_-15px_rgba(156,11,59,0.6)]"
                    : "border-2 border-dashed border-zinc-300 bg-gradient-to-br from-cream/60 to-white hover:border-brand/60"
                }`}
                style={delay(150)}
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou photo privée de l'API
                  <img
                    src={photoPreview}
                    alt="Your photo"
                    className="size-full rounded-full object-cover ring-4 ring-white"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-zinc-500 transition-colors group-hover:text-brand">
                    <CameraIcon />
                    <span className="text-sm font-semibold">
                      Choose a photo
                    </span>
                  </span>
                )}
                {/* Le petit bouton rond "appareil photo" */}
                <span
                  aria-hidden
                  className="absolute bottom-2 right-2 flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#c2185b] text-white shadow-lg ring-4 ring-white transition group-hover:scale-110"
                >
                  <span className="scale-[0.55]">
                    <CameraIcon />
                  </span>
                </span>
              </button>

              <p className="text-sm text-zinc-600">
                {photoPreview ? (
                  <>
                    {photoFile
                      ? "Looking good! You can"
                      : "Your current photo. You can"}{" "}
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
        {error && (
          <p
            aria-live="polite"
            className="mt-5 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-200"
          >
            {error}
          </p>
        )}

        {inModal && (
          <div className="sticky bottom-0 -mx-6 mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 bg-white/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-navy"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-full bg-gradient-to-r from-brand to-[#c2185b] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(156,11,59,0.8)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
        <div className={`mt-7 flex items-center justify-between gap-3 border-t border-zinc-100 pt-5 ${inModal ? "hidden" : ""}`}>
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || pending}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-navy disabled:invisible"
          >
            ← Back
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-full bg-gradient-to-r from-brand to-[#c2185b] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(156,11,59,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(156,11,59,0.9)] active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {pending ? "Saving..." : finishLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-gradient-to-r from-brand to-[#c2185b] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(156,11,59,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(156,11,59,0.9)] active:translate-y-0"
            >
              Continue →
            </button>
          )}
        </div>
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
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/** Une carte de choix : titre, petite phrase, rond de sélection (et barres de niveau). */
function ChoiceCard({
  selected,
  onClick,
  title,
  hint,
  meter,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint: string;
  /** Niveau d'anglais : 1 à 4 petites barres */
  meter?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
        selected
          ? "border-brand/50 bg-gradient-to-br from-brand/[0.06] to-accent/[0.07] shadow-[0_10px_24px_-14px_rgba(156,11,59,0.6)] ring-2 ring-brand/15"
          : "border-zinc-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={`font-semibold ${selected ? "text-brand" : "text-zinc-900"}`}
          >
            {title}
          </span>
          {meter !== undefined && (
            <span aria-hidden className="flex items-end gap-0.5">
              {[1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={`w-1 rounded-full ${bar <= meter ? (selected ? "bg-brand" : "bg-accent") : "bg-zinc-200"}`}
                  style={{ height: 4 + bar * 2.5 }}
                />
              ))}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>
      </span>
      {/* Le rond de sélection */}
      <span
        aria-hidden
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition ${
          selected
            ? "bg-gradient-to-br from-brand to-[#c2185b] text-white shadow-sm"
            : "ring-1 ring-zinc-300 group-hover:ring-zinc-400"
        }`}
      >
        {selected && <span className="text-[11px] font-bold">✓</span>}
      </span>
    </button>
  );
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
      <span className="mb-1.5 block text-xs font-semibold text-zinc-600">
        {label}
      </span>
      <input
        {...inputProps}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand/50 focus:ring-4 focus:ring-brand/10 autofill:shadow-[inset_0_0_0_1000px_#fff]"
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
      <p className="mb-1.5 block text-xs font-semibold text-zinc-600">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {[...options, ...custom].map((option) => {
          const isOn = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={isOn}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                isOn
                  ? "border-transparent bg-gradient-to-r from-brand to-[#c2185b] text-white shadow-[0_6px_16px_-8px_rgba(156,11,59,0.8)]"
                  : "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand"
              }`}
            >
              {isOn && (
                <span aria-hidden className="text-xs">
                  ✓
                </span>
              )}
              {option}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 flex gap-2">
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
          className="w-full max-w-64 rounded-full border border-dashed border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-solid focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!draft.trim()}
          className="rounded-full bg-navy px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          + Add
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
