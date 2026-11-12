"use client";

import { useState } from "react";
import { EVENT_CURRENCIES } from "@/lib/event-price";

// Gratuit ou payant ? Si payant : le tarif et la monnaie.
// Utilisé par le formulaire "Publish" et par le formulaire "Edit" d'un événement.
export function EventPriceFields({
  defaultPaid = false,
  defaultPrice = null,
  defaultCurrency = "Ar",
  fieldClass,
  labelClass,
}: {
  defaultPaid?: boolean;
  defaultPrice?: number | null;
  defaultCurrency?: string | null;
  fieldClass: string;
  labelClass: string;
}) {
  const [paid, setPaid] = useState(defaultPaid);

  return (
    <div className="anim-dropdown space-y-3">
      <span className={labelClass}>Entry</span>
      <div role="radiogroup" aria-label="Entry" className="grid grid-cols-2 gap-2">
        {[
          { value: false, label: "Free", hint: "Everyone can join" },
          { value: true, label: "Paid", hint: "Members pay a price" },
        ].map((option) => {
          const active = paid === option.value;
          return (
            <label
              key={option.label}
              className={`cursor-pointer rounded-2xl px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-accent/60 ${
                active
                  ? option.value
                    ? "bg-accent/20 text-white ring-1 ring-accent"
                    : "bg-emerald-500/20 text-white ring-1 ring-emerald-400/60"
                  : "bg-white/[0.06] text-white/60 hover:text-white"
              }`}
            >
              <input
                type="radio"
                name="isPaid"
                value={option.value ? "on" : ""}
                checked={active}
                onChange={() => setPaid(option.value)}
                className="sr-only"
              />
              <span className="block text-sm font-bold">{option.label}</span>
              <span className="block text-[11px] opacity-70">{option.hint}</span>
            </label>
          );
        })}
      </div>

      {paid && (
        <div className="anim-dropdown flex gap-2">
          <label className="block flex-1">
            <span className={labelClass}>Price *</span>
            <input
              name="price"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              defaultValue={defaultPrice ?? undefined}
              placeholder="e.g. 10000"
              className={fieldClass}
            />
          </label>
          <label className="block w-24">
            <span className={labelClass}>Currency</span>
            <select name="currency" defaultValue={defaultCurrency ?? "Ar"} className={fieldClass}>
              {EVENT_CURRENCIES.map((currency) => (
                <option key={currency} value={currency} className="bg-[#22102f]">
                  {currency}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
