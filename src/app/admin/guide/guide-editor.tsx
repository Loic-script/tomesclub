"use client";

import { useState, useTransition } from "react";
import { GuideDialog } from "@/components/guide-dialog";
import { GuideIcon } from "@/components/guide-icons";
import {
  DEFAULT_GUIDE,
  GUIDE_ICONS,
  GUIDE_LIMITS,
  type GuideIconKey,
  type GuideStepData,
} from "@/lib/guide-defaults";
import { resetGuideAction, saveGuideAction } from "./actions";

// L'éditeur du guide : chaque étape a une icône, un titre et un texte.
// On peut ajouter, supprimer, monter / descendre une étape, voir l'aperçu, puis enregistrer.

type EditableStep = GuideStepData & { key: number };

let nextKey = 1;
const withKeys = (steps: GuideStepData[]): EditableStep[] =>
  steps.map((step) => ({ ...step, key: nextKey++ }));

export function GuideEditor({ initial }: { initial: GuideStepData[] }) {
  const [steps, setSteps] = useState<EditableStep[]>(() => withKeys(initial));
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [preview, setPreview] = useState(false);
  const [armedReset, setArmedReset] = useState(false);
  const [pending, startTransition] = useTransition();

  function change(next: EditableStep[]) {
    setSteps(next);
    setDirty(true);
    setMessage(null);
  }

  function update(key: number, patch: Partial<GuideStepData>) {
    change(
      steps.map((step) => (step.key === key ? { ...step, ...patch } : step)),
    );
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    change(next);
  }

  function save() {
    startTransition(async () => {
      const result = await saveGuideAction(
        steps.map(({ icon, title, body }) => ({ icon, title, body })),
      );
      if (result.ok) {
        setDirty(false);
        setMessage({ ok: true, text: "Saved ✓ Members now see this guide." });
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  function reset() {
    startTransition(async () => {
      await resetGuideAction();
      setSteps(withKeys(DEFAULT_GUIDE));
      setDirty(false);
      setArmedReset(false);
      setMessage({ ok: true, text: "Back to the default guide ✓" });
    });
  }

  const invalid = steps.some(
    (step) =>
      !step.title.trim() ||
      !step.body.trim() ||
      step.title.length > GUIDE_LIMITS.title ||
      step.body.length > GUIDE_LIMITS.body,
  );

  return (
    <div className="space-y-4 pb-24">
      {/* La barre d'actions */}
      <div className="neu anim-rise sticky top-3 z-20 flex flex-wrap items-center gap-2 rounded-3xl px-3 py-3 sm:px-4">
        <p className="mr-auto text-sm font-semibold text-white">
          {steps.length} {steps.length === 1 ? "step" : "steps"}
          {dirty && (
            <span className="ml-2 text-xs font-medium text-amber-300">
              · not saved
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="neu-sm neu-btn rounded-full px-4 py-2 text-xs font-semibold text-white/85 hover:text-white"
        >
          Preview
        </button>
        {armedReset ? (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pending}
              onClick={reset}
              className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              Reset all?
            </button>
            <button
              type="button"
              onClick={() => setArmedReset(false)}
              className="rounded-full px-3 py-2 text-xs font-semibold text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setArmedReset(true)}
            className="rounded-full px-3 py-2 text-xs font-semibold text-white/60 transition hover:text-white"
          >
            Reset to default
          </button>
        )}
        <button
          type="button"
          disabled={pending || !dirty || invalid}
          onClick={save}
          className="neu-btn rounded-full bg-gradient-to-r from-accent to-brand px-5 py-2 text-xs font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {message && (
          <p
            role="status"
            className={`w-full px-1 text-xs font-medium ${message.ok ? "text-emerald-300" : "text-red-300"}`}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* Les étapes */}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="neu anim-rise rounded-3xl px-3 py-4 sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-brand text-white shadow-md">
                <GuideIcon icon={step.icon} className="size-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                Step {index + 1}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <SmallButton
                  label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </SmallButton>
                <SmallButton
                  label="Move down"
                  disabled={index === steps.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </SmallButton>
                <SmallButton
                  label="Delete this step"
                  disabled={steps.length <= GUIDE_LIMITS.minSteps}
                  onClick={() =>
                    change(steps.filter((item) => item.key !== step.key))
                  }
                  danger
                >
                  ×
                </SmallButton>
              </span>
            </div>

            {/* Le choix de l'icône */}
            <div
              role="radiogroup"
              aria-label="Icon"
              className="mb-3 flex flex-wrap gap-1.5"
            >
              {GUIDE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={step.icon === icon}
                  aria-label={icon}
                  onClick={() =>
                    update(step.key, { icon: icon as GuideIconKey })
                  }
                  className={`flex size-8 items-center justify-center rounded-lg transition ${
                    step.icon === icon
                      ? "bg-accent text-navy shadow-md"
                      : "bg-white/[0.07] text-white/60 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <GuideIcon icon={icon} className="size-4" />
                </button>
              ))}
            </div>

            <Field
              label="Title"
              count={step.title.length}
              max={GUIDE_LIMITS.title}
            >
              <input
                value={step.title}
                onChange={(event) =>
                  update(step.key, { title: event.target.value })
                }
                maxLength={GUIDE_LIMITS.title + 20}
                className="neu-inset w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-accent/50"
                placeholder="Short title"
              />
            </Field>
            <Field
              label="Text"
              count={step.body.length}
              max={GUIDE_LIMITS.body}
            >
              <textarea
                value={step.body}
                onChange={(event) =>
                  update(step.key, { body: event.target.value })
                }
                rows={3}
                className="neu-inset w-full resize-y rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-accent/50"
                placeholder="What should the member know?"
              />
            </Field>
          </li>
        ))}
      </ol>

      <button
        type="button"
        disabled={steps.length >= GUIDE_LIMITS.maxSteps}
        onClick={() =>
          change([
            ...steps,
            { key: nextKey++, icon: "sparkle", title: "", body: "" },
          ])
        }
        className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-white/25 py-4 text-sm font-semibold text-white/70 transition hover:border-accent/60 hover:text-white disabled:opacity-40"
      >
        <span aria-hidden className="text-lg leading-none">
          +
        </span>
        Add a step
      </button>

      <GuideDialog
        steps={steps.filter((step) => step.title.trim() && step.body.trim())}
        open={preview}
        onClose={() => setPreview(false)}
      />
    </div>
  );
}

function Field({
  label,
  count,
  max,
  children,
}: {
  label: string;
  count: number;
  max: number;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block last:mb-0">
      <span className="mb-1.5 flex items-center px-1 text-[11px] font-semibold uppercase tracking-wider text-white/45">
        {label}
        <span
          className={`ml-auto tabular-nums ${count > max ? "text-red-300" : "text-white/35"}`}
        >
          {count} / {max}
        </span>
      </span>
      {children}
    </label>
  );
}

function SmallButton({
  label,
  disabled,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold transition disabled:opacity-30 ${
        danger
          ? "text-white/70 hover:bg-red-500 hover:text-white"
          : "text-white/70 hover:bg-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
