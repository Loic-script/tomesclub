import { redirect } from "next/navigation";

// L'ancienne adresse /call vit maintenant dans l'application : /calls.
export default function OldCallPage() {
  redirect("/calls");
}
