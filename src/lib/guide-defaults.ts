// Le guide "How it works" : les étapes par défaut.
// L'admin peut les changer dans /admin/guide (elles sont alors gardées dans la table guide_step).
// Pas de "server-only" : l'éditeur admin s'en sert aussi (bouton "Reset to default").

export const GUIDE_ICONS = [
  "handshake",
  "sparkle",
  "home",
  "phone",
  "rooms",
  "calendar",
  "ring",
  "users",
  "bell",
  "chat",
  "user",
  "menu",
  "tips",
  "lock",
  "star",
] as const;

export type GuideIconKey = (typeof GUIDE_ICONS)[number];

export type GuideStepData = { icon: GuideIconKey; title: string; body: string };

export const GUIDE_LIMITS = {
  minSteps: 1,
  maxSteps: 20,
  title: 80,
  body: 600,
} as const;

export const DEFAULT_GUIDE: GuideStepData[] = [
  {
    icon: "handshake",
    title: "Welcome to Tomes Club!",
    body: "Tomes Club is a place to practice speaking English with real people, by video. This short guide shows you how everything works. It takes one minute.",
  },
  {
    icon: "home",
    title: "Home: your starting point",
    body: "Home shows what is happening now: live calls, open rooms, the next classes and your new notifications. Tap a tile to go there. Your photo at the top opens your profile.",
  },
  {
    icon: "phone",
    title: "Calls: talk one-to-one",
    body: "Open Calls and tap Search to meet a random partner who is online, or choose a member and call them directly. A green dot means the person is online now. A call lasts 5 minutes. To avoid too many calls: after a call, wait 20 minutes before you call the same person again, and call the same person 5 times a day at most. You can call other members at any time.",
  },
  {
    icon: "rooms",
    title: "Rooms: talk in a group",
    body: "Join an open room, or create your own: choose an activity, a theme and a duration (1 to 60 minutes). The host can show files (PDF, pictures) to everyone. A private room is only for the people you invite: everyone can create one, but it needs a payment by MVola and the admin's approval before it opens.",
  },
  {
    icon: "calendar",
    title: "Events: classes and news",
    body: "Events lists the next classes. Tap Register to take your place. For a paid event, pay by MVola, then send the reference or a screenshot: you can join the live only after the admin confirms your payment. You get a reminder 24 hours before the event.",
  },
  {
    icon: "ring",
    title: "When someone calls you",
    body: "A window rings on your screen when a member calls you, when you are invited to a private room, or when an event starts. Tap Accept to join or Decline to say no. Keep the app open so you don't miss a call.",
  },
  {
    icon: "lock",
    title: "Stay until the end",
    body: "This is very important: as soon as the countdown starts (in a call, a room or a live event), you can't leave: you stay until the time is up. The Leave button is hidden and comes back at the end. Before the countdown starts (for example, while you wait for the other person in a call), you can still leave. Tip: tap CC at the top to see English subtitles.",
  },
  {
    icon: "users",
    title: "Members: meet the club",
    body: "See everyone in the club, with their country and English level. Tap Follow to keep your favourite partners close: they appear on your Calls page. Tap a name to see the profile.",
  },
  {
    icon: "bell",
    title: "Notifications",
    body: "A small orange number on a menu means something new is waiting there. Alerts shows all your notifications. In your profile, you can choose which ones you receive.",
  },
  {
    icon: "chat",
    title: "Talk to the admin",
    body: "The round message button, at the bottom right, opens a chat with the admin. Ask any question, and send a photo or a file if you need help.",
  },
  {
    icon: "user",
    title: "Your profile",
    body: "Keep your profile up to date: photo, country, English level and languages. In your profile you can also choose which notifications you receive, and ask to become a Leader or a Teacher.",
  },
  {
    icon: "star",
    title: "Leaders and Teachers",
    body: "Everyone starts as a Member. To become a Leader or a Teacher, choose it in your profile: the admin must confirm it first. Then, on the Events page, you can propose your own event, free or paid. The admin checks it and publishes it. For a paid event, members pay the admin; you receive 60% of each payment and the admin keeps 40%. You see your earnings in My events. As a host, a Leader or Teacher can also remove a member from their room or event (tap People), or ban them so they can't come back.",
  },
  {
    icon: "menu",
    title: "Phone or computer?",
    body: "On a phone, use the bar at the bottom of the screen. Tap + to see more: Members, Alerts, Profile and Logout. On a computer, all the menus are in the bottom bar, with the calendar on the left and the members on the right.",
  },
  {
    icon: "tips",
    title: "Tips for great practice",
    body: "Allow your camera and microphone when the browser asks. Use headphones in a quiet place. Be kind, be patient and speak English as much as you can. You can open this guide again with the ? button on Home. Have fun!",
  },
];
