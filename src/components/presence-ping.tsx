"use client";

import { useEffect } from "react";

// Dit au serveur "je suis en ligne" dès l'ouverture, puis toutes les minutes,
// et une dernière fois quand on revient sur l'onglet. Rien ne s'affiche.
const EVERY_MS = 60 * 1000;

export function PresencePing() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === "hidden") return;
      void fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => {});
    };

    ping();
    const timer = setInterval(ping, EVERY_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
