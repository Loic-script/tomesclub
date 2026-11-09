import { createAuthClient } from "better-auth/react";

// Client d'authentification pour le NAVIGATEUR (composants "use client").
// Il appelle les routes /api/auth/* du même site.
export const authClient = createAuthClient();
