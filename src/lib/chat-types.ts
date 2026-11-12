// Les types de la messagerie coach <-> membre (utilisables côté serveur et navigateur).

/** Un fichier joint à un message (photo, vidéo, document...). */
export type ChatFile = {
  name: string;
  mime: string;
  size: number;
  /** pdf | image | video | audio | office | other */
  kind: string;
  /** L'adresse pour l'afficher (ajouter ?download=1 pour le télécharger) */
  url: string;
};

export type ChatMessage = {
  id: string;
  /** true = écrit par le coach, false = écrit par le membre */
  fromCoach: boolean;
  /** Le texte (vide si le message est seulement un fichier) */
  body: string;
  file: ChatFile | null;
  /** Date au format ISO */
  createdAt: string;
};

/** Une ligne de la liste des discussions (côté admin). */
export type Conversation = {
  userId: string;
  name: string;
  hasPhoto: boolean;
  lastBody: string | null;
  lastFromCoach: boolean;
  lastAt: string | null;
  /** Messages du membre que le coach n'a pas encore lus */
  unread: number;
};

/** Longueur maximum d'un message. */
export const MAX_MESSAGE_LENGTH = 2000;

/** Le texte court d'un message dans une liste : son texte, ou "📎 nom du fichier". */
export function messagePreview(body: string, fileName: string | null | undefined): string {
  return body || (fileName ? `📎 ${fileName}` : "");
}
