// Les choix proposés dans le formulaire d'accueil.
// Fichier partagé entre le navigateur (affichage) et le serveur (vérification).

export const OCCUPATIONS = [
  {
    kind: "student",
    label: "Student",
    detailLabel: "What do you study?",
    placeholder: "e.g. Computer science",
  },
  {
    kind: "employee",
    label: "Employee",
    detailLabel: "What is your job?",
    placeholder: "e.g. Accountant",
  },
  {
    kind: "entrepreneur",
    label: "Entrepreneur",
    detailLabel: "What is your business?",
    placeholder: "e.g. Online shop",
  },
  {
    kind: "jobSeeker",
    label: "Job seeker",
    detailLabel: "What kind of job are you looking for?",
    placeholder: "e.g. Tourism",
  },
  {
    kind: "other",
    label: "Other",
    detailLabel: "Tell us more",
    placeholder: "e.g. Retired",
  },
] as const;

export type OccupationKind = (typeof OCCUPATIONS)[number]["kind"];

export const ENGLISH_LEVELS = [
  { value: "beginner", label: "Beginner", hint: "I am just starting" },
  { value: "elementary", label: "Elementary", hint: "I know simple phrases" },
  { value: "intermediate", label: "Intermediate", hint: "I can hold a conversation" },
  { value: "advanced", label: "Advanced", hint: "I am fluent in most situations" },
] as const;

export const LANGUAGE_OPTIONS = ["Malagasy", "French", "English"];

export const INTEREST_OPTIONS = [
  "Travel",
  "Music",
  "Movies & series",
  "Business",
  "Technology",
  "Sports",
  "Reading",
  "Cooking",
  "Gaming",
  "Culture",
];

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 Mo
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
