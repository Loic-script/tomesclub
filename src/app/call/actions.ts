"use server";

import { redirect } from "next/navigation";
import { createCall, MAX_INVITED } from "@/lib/calls";
import { requireUser } from "@/lib/session";

export type StartCallState = { error: string | null };

/** Bouton "Start video call" : crée l'appel puis ouvre la salle vidéo. */
export async function startCall(
  _prevState: StartCallState,
  formData: FormData,
): Promise<StartCallState> {
  // Toujours vérifier la session ici : une Server Action peut être appelée par n'importe qui.
  const user = await requireUser();
  const invitedIds = formData.getAll("userIds").map(String);

  if (invitedIds.length === 0) {
    return { error: "Choose at least one person to call." };
  }
  if (invitedIds.length > MAX_INVITED) {
    return { error: `You can invite up to ${MAX_INVITED} people.` };
  }

  let callId: string;
  try {
    const call = await createCall(user.id, invitedIds);
    if (!call) return { error: "Choose at least one person to call." };
    callId = call.id;
  } catch (error) {
    console.error("[startCall]", error);
    return { error: "Could not start the call. Is the video server running?" };
  }

  redirect(`/call/${callId}`);
}
