import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdmin } from "@/lib/admin";

// /admin/login vit maintenant sur la page de connexion : c'est le "verso"
// de la carte (?admin=1 arrive déjà tourné, sans animation).
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminGate />
    </Suspense>
  );
}

async function AdminGate() {
  if (await isAdmin()) redirect("/admin");
  redirect("/login?admin=1");
  return null; // jamais atteint : redirect() interrompt l'affichage
}
