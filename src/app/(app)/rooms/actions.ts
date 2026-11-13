"use server";

import { redirect } from "next/navigation";
import { isOwnProof } from "@/lib/payment-proofs";
import { privateRoomPayment } from "@/lib/private-room-payment";
import { privateModeFor } from "@/lib/private-rooms";
import { readRoomForm } from "@/lib/room-form";
import { createRoom, deleteRoomByHost } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

export type CreateRoomState = { error: string | null };

/** Formulaire "Create a room" : vérifie les choix, crée la salle puis y entre directement. */
export async function createRoomAction(
  _prevState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const user = await requireMember();

  const input = await readRoomForm(formData);
  if (typeof input === "string") return { error: input };

  // Salle privée : verrouillée pour un simple membre ; Leader / Teacher → l'admin doit accepter.
  if (input.isPrivate && (await privateModeFor(user.id)) === "locked") {
    return { error: "Please finish your profile before opening a private room." };
  }
  if (input.isPrivate) {
    // Une capture qui n'est pas la sienne ne compte pas.
    if (input.paymentProofId && !(await isOwnProof(input.paymentProofId, user.id))) input.paymentProofId = null;
    const hasRef = Boolean(input.paymentRef && input.paymentRef.length >= 4);
    if (!hasRef && !input.paymentProofId) {
      return { error: "Please pay with MVola, then give the reference or a screenshot of the payment." };
    }
    input.paymentAmount = privateRoomPayment().price;
  }

  let roomId: string;
  try {
    const room = await createRoom(user.id, input, input.isPrivate);
    roomId = room.id;
  } catch (error) {
    console.error("[createRoomAction]", error);
    return { error: "Could not create the room. Is the video server running?" };
  }

  redirect(`/room/${roomId}`);
}

/** Bouton "Delete" de l hôte : ferme la salle (tout le monde sort) et la supprime. */
export async function deleteRoomAction(roomId: string): Promise<void> {
  const user = await requireMember();
  await deleteRoomByHost(user.id, roomId);
}
