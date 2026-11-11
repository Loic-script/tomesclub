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
const KEEP_MS = 3500;
const MAX_TEXT = 300;
/** Le sous-titre montre la fin de ce qui est dit (environ 2 lignes). */
const SHOWN_CHARS = 110;
/** Au plus un envoi toutes les 120 ms, mais le dernier texte part TOUJOURS. */
const SEND_EVERY_MS = 120;
/** Silence plus long que ça : le sous-titre s efface et la prochaine phrase repart de zéro. */
const PAUSE_MS = 1300;

/** Garde la fin du texte, coupée proprement sur un mot. */
function tail(text: string, size: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= size) return clean;
  const cut = clean.slice(-size);
  const space = cut.indexOf(" ");
  return "…" + (space >= 0 ? cut.slice(space + 1) : cut);
}

type Message = { t: "cc"; on: boolean } | { t: "line"; text: string; final: boolean };
export type CaptionLine = { id: string; name: string; text: string; at: number; mine: boolean };

/* ---------- La reconnaissance vocale du navigateur (types minimum) ---------- */

type SpeechResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
type Recognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: SpeechResultList; resultIndex: number }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onstart: (() => void) | null;
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

/** Les erreurs graves de la reconnaissance vocale, expliquées simplement. */
const ERRORS: Record<string, string> = {
  "not-allowed": "Captions need microphone access. Allow the microphone in your browser.",
  "service-not-allowed": "This browser blocks voice captions. Use Chrome or Edge.",
  network: "The captions service can't be reached (Brave and Opera block it). Use Chrome or Edge.",
  "audio-capture": "No microphone found for captions.",
  "language-not-supported": "English captions are not available in this browser.",
};

/* ---------- Le crochet principal ---------- */

export function useLiveCaptions(room: Room) {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<Map<string, CaptionLine>>(new Map());
  const [micOn, setMicOn] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // Vrai quand le navigateur écoute vraiment (pour afficher "Listening...").
  const [active, setActive] = useState(false);
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
    setLines((previous) => {
      const next = new Map(previous);
      // Texte vide : la personne s est tue, on efface sa ligne.
      if (!clean) {
        next.delete(participant.identity);
        return next;
      }
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
    // Où commence la phrase en cours (dans la liste des résultats de cette écoute).
    let sentenceStart = 0;
    let lastHeard = 0;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let pending: { text: string; final: boolean } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      if (!pending) return;
      lastSent = Date.now();
      // Texte en cours : rapide (peut se perdre). Phrase finie : garantie.
      send({ t: "line", text: pending.text, final: pending.final }, pending.final);
      pending = null;
    };

    recognizer.onresult = (event) => {
      // Tout ce qui a été dit depuis le début de l écoute, puis on garde la fin :
      // le sous-titre défile au lieu de s effacer à chaque phrase.
      // Après un silence : nouvelle phrase, on ne colle pas l ancienne.
      const heardAt = Date.now();
      if (heardAt - lastHeard > PAUSE_MS) sentenceStart = event.resultIndex;
      lastHeard = heardAt;

      // Silence de plus de PAUSE_MS : on efface (chez moi et chez les autres).
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        showLine(room.localParticipant, "", true);
        if (timer) clearTimeout(timer);
        pending = { text: "", final: true };
        flush();
      }, PAUSE_MS);

      let spoken = "";
      for (let index = sentenceStart; index < event.results.length; index += 1) {
        spoken += `${event.results[index]?.[0].transcript ?? ""} `;
      }
      const last = event.results[event.results.length - 1];
      const text = tail(spoken, SHOWN_CHARS);
      if (!text) return;

      // Chez moi : tout de suite.
      showLine(room.localParticipant, text, true);

      // Chez les autres : tout de suite si possible, sinon un peu plus tard (jamais perdu).
      pending = { text, final: Boolean(last?.isFinal) };
      const wait = SEND_EVERY_MS - (Date.now() - lastSent);
      if (wait <= 0 || pending.final) {
        if (timer) clearTimeout(timer);
        flush();
      } else if (!timer) {
        timer = setTimeout(flush, wait);
      }
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
    recognizer.onstart = () => {
      // Une nouvelle écoute repart avec une liste de résultats vide.
      sentenceStart = 0;
      setActive(true);
      setProblem(null);
    };
    recognizer.onerror = (event) => {
      // "no-speech" et "aborted" sont normaux : on relance tout seul.
      const message = ERRORS[event.error];
      if (!message) return;
      stopped = true;
      setActive(false);
      setProblem(message);
      console.warn("[captions] speech recognition error:", event.error);
    };

    try {
      recognizer.start();
    } catch {
      // déjà en marche
    }
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (silenceTimer) clearTimeout(silenceTimer);
      recognizer.onend = null;
      recognizer.onstart = null;
      recognizer.abort();
      setActive(false);
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
    else if (!micOn) notice = "Your microphone is off: your voice is not captioned.";
    else if (active) notice = "🎙 Listening… speak in English";
    else notice = "Starting captions…";
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
