import type { GuideIconKey } from "@/lib/guide-defaults";

// Les icônes des étapes du guide (traits fins, couleur = currentColor).

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function GuideIcon({
  icon,
  className = "size-6",
}: {
  icon: GuideIconKey;
  className?: string;
}) {
  return (
    <svg {...base} className={className}>
      {PATHS[icon] ?? PATHS.sparkle}
    </svg>
  );
}

/** Le "?" du bouton qui ouvre le guide. */
export function GuideQuestionIcon({
  className = "size-5",
}: {
  className?: string;
}) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1 1-1.1 1.7v.5" />
      <circle cx="12" cy="16.9" r="0.6" fill="currentColor" />
    </svg>
  );
}

const PATHS: Record<GuideIconKey, React.ReactNode> = {
  handshake: (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5l1.9 5.1L19 10.5l-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />
      <path d="M19 3v3M17.5 4.5h3M5 17.5v3M3.5 19h3" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v10h4.5v-5.5h3V20H18V10" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
  ),
  rooms: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  ring: (
    <>
      <path d="M18 13.9v2.3a1.6 1.6 0 0 1-1.8 1.6 15.6 15.6 0 0 1-6.8-2.4 15.3 15.3 0 0 1-4.7-4.7A15.6 15.6 0 0 1 2.3 3.8 1.6 1.6 0 0 1 3.9 2h2.3a1.6 1.6 0 0 1 1.6 1.4c.1.8.3 1.6.6 2.3a1.6 1.6 0 0 1-.4 1.7l-1 1a12.5 12.5 0 0 0 4.7 4.7l1-1a1.6 1.6 0 0 1 1.7-.4c.7.3 1.5.5 2.3.6a1.6 1.6 0 0 1 1.3 1.6Z" />
      <path d="M15 2.5a6.5 6.5 0 0 1 6.5 6.5M15 6a3 3 0 0 1 3 3" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="5" cy="10" r="2.1" />
      <path d="M1.8 17.5a3.6 3.6 0 0 1 4-3" />
      <circle cx="19" cy="10" r="2.1" />
      <path d="M22.2 17.5a3.6 3.6 0 0 0-4-3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6.5 1.8 6.5H4.2S6 14 6 9.5Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3.5 21l1.5-4.6A8.5 8.5 0 1 1 21 12Z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  menu: (
    <>
      <rect x="2" y="4" width="14" height="10" rx="1.6" />
      <path d="M6 18h6M9 14v4" />
      <rect x="17.5" y="8" width="4.5" height="12" rx="1.2" />
    </>
  ),
  tips: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8v.3h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z" />
    </>
  ),
};
