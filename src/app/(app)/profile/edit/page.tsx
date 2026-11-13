import { redirect } from "next/navigation";

// La modification du profil se fait dans une fenêtre, sur la page Profile.
export default function EditProfilePage() {
  redirect("/profile?edit=1");
}
