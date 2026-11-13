import { sendEventReminders } from "@/lib/event-reminders";

// POST /api/internal/event-reminders : envoie les rappels « l'événement commence dans 24 h ».
// Appelé toutes les 5 minutes par le serveur lui-même (src/instrumentation.ts), avec un jeton secret.
export async function POST(request: Request) {
  const token = process.env.EVENT_REMINDER_TOKEN;
  if (!token || request.headers.get("x-reminder-token") !== token) {
    return new Response(null, { status: 404 });
  }
  try {
    return Response.json({ sent: await sendEventReminders() });
  } catch (error) {
    console.error("[event-reminders]", error);
    return Response.json({ sent: 0 }, { status: 500 });
  }
}
