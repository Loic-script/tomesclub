import { redirect } from "next/navigation";

// L'inscription se fait sur la page /login (onglet "Create account").
export default function RegisterPage() {
  redirect("/login?mode=register");
}
