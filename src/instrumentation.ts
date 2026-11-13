// Au démarrage du serveur Next.js (une fois) : toutes les 5 minutes, on envoie les rappels
// des événements qui commencent dans 24 h (voir src/lib/event-reminders.ts).

const EVERY_MS = 5 * 60_000;
const FIRST_RUN_MS = 60_000;

export function register() {
  // Seulement le vrai serveur Node, avec une base de données (pas pendant le build Docker).
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL)
    return;
  const state = globalThis as {
    eventReminderTimer?: ReturnType<typeof setInterval>;
  };
  if (state.eventReminderTimer) return;

  // Un jeton secret, connu seulement de ce serveur : personne d'autre ne peut lancer les rappels.
  const token = crypto.randomUUID();
  process.env.EVENT_REMINDER_TOKEN = token;
  const run = () => {
    fetch(
      `http://127.0.0.1:${process.env.PORT ?? 3000}/api/internal/event-reminders`,
      {
        method: "POST",
        headers: { "x-reminder-token": token },
      },
    ).catch((error: unknown) => console.error("[event-reminders]", error));
  };
  // unref : ces minuteurs n'empêchent jamais le processus de s'arrêter.
  setTimeout(run, FIRST_RUN_MS).unref();
  state.eventReminderTimer = setInterval(run, EVERY_MS);
  state.eventReminderTimer.unref();
}
