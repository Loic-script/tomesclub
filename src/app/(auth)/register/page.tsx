import { redirect } from "next/navigation";

// Il n'y a plus de page d'inscription : le compte se crée tout seul
// à la première connexion avec Google. On renvoie vers /login.
export default function RegisterPage() {
  redirect("/login");
}
