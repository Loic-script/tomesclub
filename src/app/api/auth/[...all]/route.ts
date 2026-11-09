import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Toutes les routes /api/auth/* (inscription, connexion, déconnexion, session...)
export const { GET, POST } = toNextJsHandler(auth);
