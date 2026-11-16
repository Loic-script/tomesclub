"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getPushKey, subscribePush, unsubscribePush, type PushAudience } from "@/app/push-actions";

type Status = "unsupported" | "denied" | "off" | "on" | "busy";

const supported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** La clé du site (texte base64url) → octets, comme le navigateur la veut. */
function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "===".slice((base64.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/** L'état des notifications sur cet appareil, et de quoi les allumer / éteindre. */
function usePush(audience: PushAudience) {
  const [status, setStatus] = useState<Status>("busy");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supported()) return "unsupported" as const;
      if (Notification.permission === "denied") return "denied" as const;
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        // On redonne l'abonnement au serveur (il a pu changer, ou appartenir à un autre compte).
        await subscribePush(sub.toJSON(), audience);
        return "on" as const;
      }
      return "off" as const;
    })()
      .then((next) => alive && setStatus(next))
      .catch(() => alive && setStatus("off"));
    return () => {
      alive = false;
    };
  }, [audience]);

  const turnOn = async () => {
    setStatus("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(await getPushKey()),
        }));
      const { ok } = await subscribePush(sub.toJSON(), audience);
      setStatus(ok ? "on" : "off");
    } catch (error) {
      console.warn("[push]", error);
      setStatus("off");
    }
  };

  const turnOff = async () => {
    setStatus("busy");
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
    } finally {
      setStatus("off");
    }
  };

  return { status, turnOn, turnOff };
}

const isApple = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Vrai côté navigateur seulement (évite un écran différent entre serveur et navigateur). */
const useClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/** Le texte d'aide quand le navigateur bloque. */
function blockedHelp(): string {
  if (isApple() && !standalone()) {
    return "On iPhone: first install the app (Share → Add to Home Screen), open it from its icon, then turn on notifications.";
  }
  return "Notifications are blocked. Tap the lock 🔒 next to the address → Permissions → Notifications → Allow.";
}

/**
 * Le réglage complet (page Notifications) : allumer / éteindre les notifications sur cet appareil.
 */
export function PushSetting({ audience }: { audience: PushAudience }) {
  const client = useClient();
  const { status, turnOn, turnOff } = usePush(audience);
  if (!client) return null;
  const iphoneNeedsInstall = isApple() && !standalone();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white">
      <span className="grid size-9 place-items-center rounded-full bg-brand/80"><BellIcon /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Phone notifications</p>
        <p className="text-xs text-white/60">
          {status === "on"
            ? "On: calls, messages, events and payments ring on this device, even when the app is closed."
            : status === "unsupported" || iphoneNeedsInstall
              ? iphoneNeedsInstall
                ? "On iPhone: install the app first (Share → Add to Home Screen), then open it from its icon."
                : "This browser cannot show notifications. Try Chrome."
              : status === "denied"
                ? blockedHelp()
                : "Get calls, messages, events and payments like on WhatsApp, even when the app is closed."}
        </p>
      </div>
      {status === "on" ? (
        <button type="button" onClick={turnOff} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15">
          Turn off
        </button>
      ) : status === "off" && !iphoneNeedsInstall ? (
        <button type="button" onClick={turnOn} className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:brightness-110">
          Turn on
        </button>
      ) : status === "busy" ? (
        <span className="text-xs text-white/50">…</span>
      ) : null}
    </div>
  );
}

const DISMISS_KEY = "tc-push-later";
const DISMISS_DAYS = 3;

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Petite bannière en haut : "Turn on notifications" (tant que ce n'est pas fait).
 * "Later" la cache 3 jours.
 */
export function PushPrompt({ audience }: { audience: PushAudience }) {
  const client = useClient();
  const { status, turnOn } = usePush(audience);
  const [later, setLater] = useState(false);
  if (!client || later || status !== "off" || dismissedRecently()) return null;
  if (isApple() && !standalone()) return null; // iPhone : il faut d'abord installer l'application

  return (
    <div className="anim-rise fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-zinc-900/95 p-3 text-white shadow-2xl backdrop-blur-md">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand"><BellIcon /></span>
      <p className="min-w-0 flex-1 text-xs leading-5 text-white/80">
        <b className="block text-sm text-white">Turn on notifications</b>
        Calls, messages and events will ring on this device, like WhatsApp.
      </p>
      <div className="flex shrink-0 flex-col gap-1">
        <button type="button" onClick={turnOn} className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold hover:brightness-110">
          Turn on
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, String(Date.now()));
            } catch {}
            setLater(true);
          }}
          className="rounded-full px-3 py-1 text-[11px] text-white/60 hover:text-white"
        >
          Later
        </button>
      </div>
    </div>
  );
}
