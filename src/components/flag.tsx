import "flag-icons/css/flag-icons.min.css";
import { countryCodeOf } from "@/lib/countries";

// Le drapeau d'un pays (images du paquet flag-icons : pareilles sur tous les appareils).
// country = le nom enregistré dans le profil (ex : "Madagascar"). Rien si le pays est inconnu.
export function Flag({ country, className = "h-3 w-4" }: { country: string | null | undefined; className?: string }) {
  const code = countryCodeOf(country);
  if (!code) return null;
  return (
    <span
      role="img"
      aria-label={country ?? code}
      title={country ?? code}
      className={`fi fi-${code.toLowerCase()} inline-block shrink-0 rounded-[3px] !bg-cover !bg-center shadow-sm ring-1 ring-black/10 ${className}`}
    />
  );
}
