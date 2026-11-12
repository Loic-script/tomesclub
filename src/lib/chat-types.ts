// Les types de la messagerie coach <-> membre (utilisables côté serveur et navigateur).

export type ChatMessage = {
  id: string;
  /** true = écrit par le coach, false = écrit par le membre */
  fromCoach: boolean;
  body: string;
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
