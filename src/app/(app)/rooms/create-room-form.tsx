"use client";

import { useActionState, useState, type ReactNode } from "react";
import { ActivityIcon } from "@/components/activity-icon";
import { MvolaLogo, PaymentDialog, type PaymentDraft } from "@/components/payment-dialog";
import { MemberAvatar } from "@/components/member-avatar";
import {
  DEFAULT_DURATION,
  MAX_DURATION,
  MIN_DURATION,
  DEFAULT_PEOPLE,
  ROOM_MAX_PEOPLE,
  ROOM_MIN_PEOPLE,
  ROOM_DURATIONS,
  ROOM_LEVELS,
  type RoomActivity,
} from "@/lib/room-activities";
import { createRoomAction, type CreateRoomState } from "./actions";

const VISIBILITIES = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
] as const;

/** Qui peut ouvrir une salle privée : personne (membre), après accord (Leader / Teacher), tout de suite (admin). */
export type PrivateMode = "locked" | "approval" | "direct";
export type InviteChoice = { id: string; name: string; hasPhoto: boolean };
/** Le prix d'une salle privée et le numéro MVola de l'admin. */
export type PaymentInfo = { price: number; mvola: string | null; receiver: string | null };

const formatAr = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} Ar`;

const PRIVATE_HINT: Record<PrivateMode, string> = {
  locked: "Finish your profile to open a private room.",
  approval: "Only the members you invite can join. The admin must approve it first.",
  direct: "Only the members you invite can join.",
};

const initialState: CreateRoomState = { error: null };

/** Un conseil selon le niveau (repris du fichier des activités). */
function levelTip(level: string): string | null {
  if (level === "beginner" || level === "elementary") {
    return "Tip: use simple linking words: because, but, so, for example.";
  }
  if (level === "intermediate" || level === "advanced") {
    return "Tip: use stronger connectors: however, as a result, in contrast, on the other hand.";
  }
  return null;
}

/** La description toute prête pour un thème proposé. */
function describe(activity: RoomActivity, format: string, duration: number, level: string): string {
  return [
    activity.description,
    "1. Prepare (1 min): read the theme and note 2–3 ideas.",
    `2. Do it (${duration} min): ${format}.`,
    "3. Feedback: share one thing that went well and one thing to improve.",
    levelTip(level),
  ]
    .filter(Boolean)
    .join("\n");
}

const field =
  "neu-inset w-full rounded-xl px-3 py-2 text-white placeholder:text-white/40 outline-none transition focus:ring-2 focus:ring-accent/40";
const labelText = "mb-1.5 block text-sm font-medium text-white/75";

// Le formulaire "Create a room", replié derrière un bouton.
// Étape 1 : choisir l'activité. Étape 2 : thème, options, puis confirmer.
export function CreateRoomForm({
  activities,
  action = createRoomAction,
  defaultOpen = false,
  privateMode = "locked",
  members = [],
  payment = null,
}: {
  /** Salle privée d'un Leader / Teacher : il paie l'admin avant (null = pas de paiement, ex : admin). */
  payment?: PaymentInfo | null;
  /** Qui peut ouvrir une salle privée (voir PrivateMode). */
  privateMode?: PrivateMode;
  /** Les membres qu'on peut inviter dans une salle privée. */
  members?: InviteChoice[];
  /** Le catalogue (les 13 activités + celles ajoutées par l'admin). */
  activities: RoomActivity[];
  /** L'action serveur qui crée la salle (membre ou admin). */
  action?: (state: CreateRoomState, formData: FormData) => Promise<CreateRoomState>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [activity, setActivity] = useState<RoomActivity | null>(null);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="neu neu-btn flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-bold text-white"
      >
        <PlusIcon rotated={open} />
        {open ? "Close" : "Create a room"}
      </button>

      {/* Le formulaire se déplie sous le bouton */}
      {open && (
        <div className="anim-rise mt-4">
          {activity ? (
            <RoomOptions
              key={activity.key}
              activity={activity}
              onChangeActivity={() => setActivity(null)}
              formAction={formAction}
              pending={pending}
              error={state.error}
              privateMode={privateMode}
              members={members}
              payment={payment}
            />
          ) : (
            <ActivityPicker activities={activities} onPick={setActivity} />
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Étape 1 : l'activité ---------- */

function ActivityPicker({
  activities,
  onPick,
}: {
  activities: RoomActivity[];
  onPick: (activity: RoomActivity) => void;
}) {
  return (
    <section className="neu rounded-3xl p-5">
      <StepTitle step={1} title="Choose an activity" hint="What will the group do together?" />
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {activities.map((activity) => (
          <li key={activity.key}>
            <button
              type="button"
              onClick={() => onPick(activity)}
              title={activity.description}
              className="flex h-full w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-accent/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/30 to-brand/30 text-accent ring-1 ring-white/10">
                <ActivityIcon icon={activity.icon} className="size-5" />
              </span>
              <span className="text-sm font-semibold leading-tight text-white">{activity.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Étape 2 : le thème et les options ---------- */

function RoomOptions({
  activity,
  onChangeActivity,
  formAction,
  pending,
  error,
  privateMode,
  members,
  payment,
}: {
  payment: PaymentInfo | null;
  activity: RoomActivity;
  onChangeActivity: () => void;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  privateMode: PrivateMode;
  members: InviteChoice[];
}) {
  const [category, setCategory] = useState(activity.categories[0]?.name ?? "");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState(activity.formats[0] ?? "");
  const [level, setLevel] = useState("all");
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION);
  // Le texte du champ "Or your own" (peut être vide pendant la saisie)
  const [durationText, setDurationText] = useState(String(DEFAULT_DURATION));
  const [people, setPeople] = useState(DEFAULT_PEOPLE);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  // Les membres invités (salle privée)
  const [invited, setInvited] = useState<string[]>([]);
  const [inviteSearch, setInviteSearch] = useState("");
  // Le paiement de la salle privée (Leader / Teacher) : la fenêtre, puis ce qui a été payé.
  const needsPayment = privateMode === "approval" && payment !== null;
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState<PaymentDraft | null>(null);
  // Thème proposé → description écrite pour l'hôte (et mise à jour avec les options).
  // Thème écrit par l'hôte → il écrit sa propre description.
  const [autoDescription, setAutoDescription] = useState(false);
  const [ownDescription, setOwnDescription] = useState("");
  const description = autoDescription ? describe(activity, format, duration, level) : ownDescription;

  function chooseSuggestion(suggestion: string) {
    setTopic(suggestion);
    setAutoDescription(true);
  }

  function writeOwnTheme(value: string) {
    setTopic(value);
    if (autoDescription) {
      setAutoDescription(false);
      setOwnDescription("");
    }
  }

  const topics = activity.categories.find((entry) => entry.name === category)?.topics ?? [];
  const levelName = ROOM_LEVELS.find((entry) => entry.value === level)?.label;

  function surprise() {
    const all = activity.categories.flatMap((entry) =>
      entry.topics.map((suggestion) => ({ category: entry.name, suggestion })),
    );
    const picked = all[Math.floor(Math.random() * all.length)];
    if (!picked) return;
    setCategory(picked.category);
    chooseSuggestion(picked.suggestion);
  }

  return (
    <form action={formAction} className="neu space-y-5 rounded-3xl p-5">
      <input type="hidden" name="activity" value={activity.key} />
      <input type="hidden" name="format" value={format} />
      <input type="hidden" name="duration" value={duration} />

      {/* L'activité choisie */}
      <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand text-white shadow-lg ring-1 ring-white/20">
          <ActivityIcon icon={activity.icon} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Activity</p>
          <p className="font-display font-bold text-white">{activity.name}</p>
          <p className="mt-0.5 text-xs leading-5 text-white/60">{activity.description}</p>
        </div>
        <button
          type="button"
          onClick={onChangeActivity}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/15 transition hover:text-white"
        >
          Change
        </button>
      </div>

      <StepTitle step={2} title="Theme and options" hint="Pick a suggested theme or write your own." />

      {/* ----- Le thème ----- */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white/75">Theme *</span>
          <button
            type="button"
            onClick={surprise}
            className="rounded-full px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/40 transition hover:bg-accent/10"
          >
            🎲 Surprise me
          </button>
        </div>

        {/* Les catégories */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {activity.categories.map((entry) => (
            <button
              key={entry.name}
              type="button"
              aria-pressed={entry.name === category}
              onClick={() => setCategory(entry.name)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                entry.name === category
                  ? "bg-accent text-ink"
                  : "text-white/65 ring-1 ring-white/15 hover:text-white"
              }`}
            >
              {entry.name} <span className="opacity-60">{entry.topics.length}</span>
            </button>
          ))}
        </div>

        {/* Les thèmes proposés : un clic remplit le champ */}
        <ul className="neu-inset max-h-48 space-y-1 overflow-y-auto rounded-2xl p-1.5">
          {topics.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => chooseSuggestion(suggestion)}
                aria-pressed={topic === suggestion}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  topic === suggestion
                    ? "bg-brand font-semibold text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>

        <input
          name="topic"
          type="text"
          required
          maxLength={160}
          value={topic}
          onChange={(event) => writeOwnTheme(event.target.value)}
          placeholder="…or write your own theme"
          aria-label="Theme"
          className={`${field} mt-2`}
        />
      </div>

      {/* ----- La description ----- */}
      <label className="block">
        <span className={labelText}>
          Description{" "}
          <span className="text-white/40">
            {autoDescription ? "(written for you, you can edit it)" : "(optional)"}
          </span>
        </span>
        <textarea
          name="description"
          rows={autoDescription ? 6 : 3}
          maxLength={600}
          value={description}
          onChange={(event) => {
            setAutoDescription(false);
            setOwnDescription(event.target.value);
          }}
          placeholder="What will you do? Any rules or tips for the group?"
          className={`${field} resize-y leading-6`}
        />
      </label>

      {/* ----- Le format ----- */}
      <fieldset>
        <legend className={labelText}>Format</legend>
        <div className="flex flex-wrap gap-1.5">
          {activity.formats.map((option) => (
            <ChoiceChip key={option} selected={format === option} onClick={() => setFormat(option)}>
              {option}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      {/* ----- Le niveau ----- */}
      <fieldset>
        <legend className={labelText}>English level</legend>
        <input type="hidden" name="level" value={level} />
        <div className="flex flex-wrap gap-1.5">
          {ROOM_LEVELS.map((entry) => (
            <ChoiceChip
              key={entry.value}
              selected={level === entry.value}
              onClick={() => setLevel(entry.value)}
            >
              {entry.label}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      {/* ----- La durée ----- */}
      <div>
        <fieldset>
          <legend className={labelText}>Duration</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {ROOM_DURATIONS.map((minutes) => (
              <ChoiceChip
                key={minutes}
                selected={duration === minutes}
                onClick={() => {
                  setDuration(minutes);
                  setDurationText(String(minutes));
                }}
                label={`${minutes} minutes`}
              >
                {minutes}′
              </ChoiceChip>
            ))}
          </div>
        </fieldset>
        {/* Ou sa propre durée, de 1 à 60 minutes */}
        <div className="mt-2.5 flex items-center gap-3">
          <span className="text-xs text-white/60">Or your own</span>
          {/* Le sélecteur : − [15 min] + (on peut aussi taper le nombre) */}
          <div
            className={`neu-inset flex items-center rounded-full p-1 transition ${
              (ROOM_DURATIONS as readonly number[]).includes(duration) ? "" : "ring-1 ring-accent"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const minutes = Math.max(MIN_DURATION, duration - 1);
                setDuration(minutes);
                setDurationText(String(minutes));
              }}
              disabled={duration <= MIN_DURATION}
              aria-label="One minute less"
              className="flex size-8 items-center justify-center rounded-full text-lg font-bold leading-none text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              −
            </button>
            <label className="flex items-baseline gap-1 px-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={durationText}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                  setDurationText(value);
                  const minutes = Number(value);
                  if (minutes >= MIN_DURATION && minutes <= MAX_DURATION) setDuration(minutes);
                }}
                onBlur={() => setDurationText(String(duration))}
                aria-label={`Duration in minutes, from ${MIN_DURATION} to ${MAX_DURATION}`}
                className="w-7 bg-transparent text-center font-display text-lg font-extrabold tabular-nums text-white outline-none"
              />
              <span className="text-xs font-semibold text-white/50">min</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const minutes = Math.min(MAX_DURATION, duration + 1);
                setDuration(minutes);
                setDurationText(String(minutes));
              }}
              disabled={duration >= MAX_DURATION}
              aria-label="One minute more"
              className="flex size-8 items-center justify-center rounded-full text-lg font-bold leading-none text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              +
            </button>
          </div>
          <span className="text-[11px] text-white/35">1 – 60</span>
        </div>
        {duration === 1 && (
          <p className="mt-1.5 text-xs text-white/50">1 minute: handy to test the room.</p>
        )}
      </div>

      {/* ----- Le nombre de personnes ----- */}
      <div>
        <span id="people-label" className={labelText}>
          Maximum people
        </span>
        <input type="hidden" name="maxParticipants" value={people} />
        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-labelledby="people-label"
            className="neu-inset flex items-center gap-1 rounded-full p-1"
          >
            <StepButton
              label="One person less"
              disabled={people <= ROOM_MIN_PEOPLE}
              onClick={() => setPeople((value) => Math.max(ROOM_MIN_PEOPLE, value - 1))}
            >
              −
            </StepButton>
            <output
              aria-live="polite"
              className="w-10 text-center font-display text-lg font-bold tabular-nums text-white"
            >
              {people}
            </output>
            <StepButton
              label="One person more"
              disabled={people >= ROOM_MAX_PEOPLE}
              onClick={() => setPeople((value) => Math.min(ROOM_MAX_PEOPLE, value + 1))}
            >
              +
            </StepButton>
          </div>
          <span className="text-xs text-white/50">
            people, you included (max {ROOM_MAX_PEOPLE})
          </span>
        </div>
      </div>

      {/* ----- Le nom et la visibilité ----- */}
      <label className="block">
        <span className={labelText}>
          Room name <span className="text-white/40">(optional)</span>
        </span>
        <input name="name" type="text" maxLength={60} placeholder={activity.name} className={field} />
      </label>

      <div>
        <span className={labelText}>Who can see it?</span>
        <div className="flex gap-2">
          {VISIBILITIES.map((option) => {
            const locked = option.value === "private" && privateMode === "locked";
            return (
              <label
                key={option.value}
                title={locked ? PRIVATE_HINT.locked : undefined}
                className={`flex-1 rounded-xl px-3 py-2 text-center transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                  locked
                    ? "cursor-not-allowed text-white/30 ring-1 ring-white/10"
                    : visibility === option.value
                      ? "neu-inset cursor-pointer text-accent"
                      : "cursor-pointer text-white/60 ring-1 ring-white/15 hover:text-white"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  disabled={locked}
                  onChange={() => {
                    // Private (Leader / Teacher) : d'abord la fenêtre de paiement.
                    if (option.value === "private" && needsPayment && !paid) {
                      setPaying(true);
                      return;
                    }
                    setVisibility(option.value);
                  }}
                  className="sr-only"
                />
                <span className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                  {option.value === "private" && <LockIcon />}
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-white/50">
          {visibility === "private"
            ? PRIVATE_HINT[privateMode]
            : privateMode === "locked"
              ? `Everyone sees it in the list. ${PRIVATE_HINT.locked}`
              : "Everyone sees it in the list."}
        </p>
      </div>

      {/* ----- Salle privée : le paiement annoncé ----- */}
      {visibility === "private" && needsPayment && paid && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 ring-1 ring-emerald-400/30">
          <input type="hidden" name="paymentMethod" value="mvola" />
          <input type="hidden" name="paymentRef" value={paid.ref} />
          <input type="hidden" name="paymentProofId" value={paid.proofId ?? ""} />
          <span>
            {formatAr(payment!.price)} paid by <MvolaLogo /> <strong>MVola</strong>
            {paid.ref && (
              <>
                {" "}· ref <code className="font-mono">{paid.ref}</code>
              </>
            )}
            {paid.proofId && " · screenshot ✓"}
          </span>
          <button type="button" onClick={() => setPaying(true)} className="ml-auto font-semibold text-white/70 hover:text-white">
            Change
          </button>
        </div>
      )}
      {paying && payment && (
        <PaymentDialog
          eyebrow="Private room"
          amountLabel={formatAr(payment.price)}
          intro={`A private room costs ${formatAr(payment.price)}. Send it to the admin by MVola. The admin checks it and opens your room.`}
          mvola={payment.mvola}
          receiver={payment.receiver}
          initial={paid}
          onCancel={() => setPaying(false)}
          onPaid={(value) => {
            setPaid(value);
            setPaying(false);
            setVisibility("private");
          }}
        />
      )}

      {/* ----- Salle privée : l'hôte choisit qui il invite ----- */}
      {visibility === "private" && privateMode !== "locked" && (
        <div className="anim-dropdown">
          <span className={labelText}>
            Invite members <span className="text-white/40">({invited.length} chosen)</span>
          </span>
          {invited.map((id) => (
            <input key={id} type="hidden" name="invite" value={id} />
          ))}
          <input
            type="search"
            value={inviteSearch}
            onChange={(event) => setInviteSearch(event.target.value)}
            placeholder="Search a member"
            aria-label="Search a member to invite"
            className={`${field} mb-2 text-sm`}
          />
          <ul className="max-h-52 space-y-1 overflow-y-auto rounded-xl bg-white/5 p-1.5 ring-1 ring-white/10">
            {members
              .filter((member) => member.name.toLowerCase().includes(inviteSearch.trim().toLowerCase()))
              .map((member) => {
                const chosen = invited.includes(member.id);
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      aria-pressed={chosen}
                      onClick={() =>
                        setInvited((list) =>
                          chosen ? list.filter((id) => id !== member.id) : [...list, member.id],
                        )
                      }
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                        chosen ? "bg-accent/15 text-white" : "text-white/75 hover:bg-white/10"
                      }`}
                    >
                      <MemberAvatar userId={member.id} name={member.name} hasPhoto={member.hasPhoto} size="size-7" />
                      <span className="min-w-0 flex-1 truncate">{member.name}</span>
                      <span
                        aria-hidden
                        className={`flex size-5 items-center justify-center rounded-md text-[11px] font-bold ${
                          chosen ? "bg-accent text-navy" : "ring-1 ring-white/25"
                        }`}
                      >
                        {chosen ? "✓" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            {members.length === 0 && <li className="px-2 py-3 text-center text-xs text-white/45">No member yet.</li>}
          </ul>
          {invited.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-300">Choose at least one member to invite.</p>
          )}
        </div>
      )}

      {/* ----- Le résumé à confirmer ----- */}
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-accent/30">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Your room</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-semibold text-white">
          <ActivityIcon icon={activity.icon} className="size-4 text-accent" /> {activity.name}
          {topic ? ` — ${topic}` : ""}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {format} · {levelName} · {duration} min · {people} people max ·{" "}
          {visibility === "private" ? "Private" : "Public"}
        </p>
        {!topic.trim() && (
          <p className="mt-1 text-xs text-amber-300">Choose or write a theme first.</p>
        )}
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-amber-300">
        {error}
      </p>
      <button
        type="submit"
        disabled={
          pending ||
          !topic.trim() ||
          (visibility === "private" && invited.length === 0) ||
          (visibility === "private" && needsPayment && !paid)
        }
        className="neu-btn w-full rounded-full bg-brand px-5 py-3 font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending
          ? "Opening the room..."
          : visibility === "private" && privateMode === "approval"
            ? "Send to the admin for approval"
            : "Confirm and open the room"}
      </button>
    </form>
  );
}

/* ---------- Petits morceaux ---------- */

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-brand text-lg font-bold leading-none text-white shadow-md transition hover:bg-accent hover:text-ink disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

function StepTitle({ step, title, hint }: { step: number; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-ink">
        {step}
      </span>
      <div>
        <h2 className="font-display text-base font-bold text-white">{title}</h2>
        <p className="text-xs text-white/55">{hint}</p>
      </div>
    </div>
  );
}

function ChoiceChip({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
        selected
          ? "bg-brand text-white ring-1 ring-accent/60"
          : "text-white/70 ring-1 ring-white/15 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function PlusIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 transition-transform duration-300 ${rotated ? "rotate-45" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
