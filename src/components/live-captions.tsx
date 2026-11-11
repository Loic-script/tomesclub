"use client";

import { RoomEvent, type Participant, type RemoteParticipant, type Room } from "livekit-client";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// Les sous-titres en anglais de l'appel vidéo.
// - Le bouton CC est partagé : quand quelqu'un l'allume, il s'allume chez tout le monde.
// - Le navigateur de chacun transcrit SA voix (micro ouvert seulement), en anglais,
//   puis envoie le texte aux autres par LiveKit (canal "captions").
// - Reconnaissance vocale du navigateur : Chrome et Edge (Firefox ne la propose pas).

const TOPIC = "captions";
/** Un sous-titre disparaît après ce temps sans nouvelle parole. */
const KEEP_MS = 4000;
const MAX_TEXT = 300;

type Message = { t: "cc"; on: boolean } | { t: "line"; text: string; final: boolean };
export type CaptionLine = { id: string; name: string; text: string; at: number; mine: boolean };

/* ---------- La reconnaissance vocale du navigateur (types minimum) ---------- */

type SpeechResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
type Recognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: SpeechResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  abort: () => void;
};
type RecognizerClass = new () => Recognizer;

function getRecognizer(): RecognizerClass | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognizerClass;
    webkitSpeechRecognition?: RecognizerClass;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

/* ---------- Le crochet principal ---------- */

export function useLiveCaptions(room: Room) {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<Map<string, CaptionLine>>(new Map());
  const [micOn, setMicOn] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // Le navigateur sait-il transcrire ? (inconnu côté serveur : on suppose que oui)
  const supported = useSyncExternalStore(noSubscribe, () => getRecognizer() !== null, () => true);

  const send = useCallback(
    (message: Message, reliable: boolean) => {
      if (room.state !== "connected") return;
      const data = new TextEncoder().encode(JSON.stringify(message));
      void room.localParticipant.publishData(data, { reliable, topic: TOPIC }).catch(() => {});
    },
    [room],
  );

  const showLine = useCallback((participant: Participant, text: string, mine: boolean) => {
    const clean = text.trim().slice(-MAX_TEXT);
    if (!clean) return;
    setLines((previous) => {
      const next = new Map(previous);
      next.set(participant.identity, {
        id: participant.identity,
        name: mine ? "You" : participant.name || "Member",
        text: clean,
        at: Date.now(),
        mine,
      });
      return next;
    });
  }, []);

  /** Le bouton CC : on change pour tout le monde. */
  const toggle = useCallback(() => {
    const next = !on;
    setOn(next);
    send({ t: "cc", on: next }, true);
  }, [on, send]);

  // Recevoir : l'état du CC et les sous-titres des autres.
  useEffect(() => {
    const onData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== TOPIC || !participant) return;
      let message: Message;
      try {
        message = JSON.parse(new TextDecoder().decode(payload)) as Message;
      } catch {
        return;
      }
      if (message.t === "cc") setOn(message.on === true);
      if (message.t === "line" && typeof message.text === "string") {
        showLine(participant, message.text, false);
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, showLine]);

  // Quelqu'un arrive pendant que le CC est allumé : on le lui dit.
  useEffect(() => {
    if (!on) return;
    const greet = () => send({ t: "cc", on: true }, true);
    room.on(RoomEvent.ParticipantConnected, greet);
    return () => {
      room.off(RoomEvent.ParticipantConnected, greet);
    };
  }, [room, on, send]);

  // Mon micro est-il ouvert ? (on ne transcrit jamais un micro coupé)
  useEffect(() => {
    const update = () => setMicOn(room.localParticipant.isMicrophoneEnabled);
    const events = [
      RoomEvent.Connected,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
      RoomEvent.TrackMuted,
      RoomEvent.TrackUnmuted,
    ] as const;
    for (const event of events) room.on(event, update);
    update();
    return () => {
      for (const event of events) room.off(event, update);
    };
  }, [room]);

  // Transcrire ma voix pendant que le CC est allumé et que mon micro est ouvert.
  const listening = on && supported && micOn;
  useEffect(() => {
    if (!listening) return;
    const Recognition = getRecognizer();
    if (!Recognition) return;

    const recognizer = new Recognition();
    recognizer.lang = "en-US";
    recognizer.continuous = true;
    recognizer.interimResults = true;
    let stopped = false;
    let lastSent = 0;

    recognizer.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (!result) return;
      const text = result[0].transcript;
      const now = Date.now();
      // Le texte "en cours" part au plus 4 fois par seconde ; la phrase finie part toujours.
      if (!result.isFinal && now - lastSent < 250) return;
      lastSent = now;
      send({ t: "line", text: text.slice(-MAX_TEXT), final: result.isFinal }, result.isFinal);
      showLine(room.localParticipant, text, true);
    };
    // Chrome s'arrête après un silence : on relance tant que le CC est allumé.
    recognizer.onend = () => {
      if (stopped) return;
      try {
        recognizer.start();
      } catch {
        // déjà relancé
      }
    };
    recognizer.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        stopped = true;
        setProblem("Captions need microphone access in your browser.");
      }
    };

    try {
      recognizer.start();
    } catch {
      // déjà en marche
    }
    return () => {
      stopped = true;
      recognizer.onend = null;
      recognizer.abort();
    };
  }, [listening, room, send, showLine]);

  // Effacer les sous-titres anciens.
  useEffect(() => {
    if (lines.size === 0) return;
    const timer = setInterval(() => {
      setLines((previous) => {
        const now = Date.now();
        const next = new Map([...previous].filter(([, line]) => now - line.at < KEEP_MS));
        return next.size === previous.size ? previous : next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lines.size]);

  let notice: string | null = null;
  if (on) {
    if (problem) notice = problem;
    else if (!supported) notice = "Your browser can't caption your voice. Use Chrome or Edge.";
    else if (!micOn) notice = "Your microphone is off.";
  }

  return {
    on,
    toggle,
    lines: [...lines.values()].sort((a, b) => a.at - b.at).slice(-3),
    notice,
  };
}

/* ---------- L'affichage, en bas de la vidéo ---------- */

export function CaptionsOverlay({ lines, notice }: { lines: CaptionLine[]; notice: string | null }) {
  if (lines.length === 0 && !notice) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-20 z-30 flex flex-col items-center gap-1.5 px-4"
    >
      {lines.map((line) => (
        <p
          key={line.id}
          className="max-w-3xl rounded-xl bg-black/75 px-4 py-2 text-center text-base leading-snug text-white shadow-lg backdrop-blur-sm sm:text-lg"
        >
          <span className={`mr-2 font-bold ${line.mine ? "text-white/60" : "text-accent"}`}>
            {line.name}:
          </span>
          {line.text}
        </p>
      ))}
      {notice && lines.length === 0 && (
        <p className="rounded-full bg-black/60 px-3 py-1 text-xs text-white/75">{notice}</p>
      )}
    </div>
  );
}
