import { NextResponse, type NextRequest } from "next/server";

// Toujours en https sur le vrai site.
// Le serveur (nginx de Mini Railway) répond aussi en http:// sans rediriger. Or les cookies de
// connexion (admin et membres) sont "secure" : en http://, le navigateur ne les garde pas,
// et on est renvoyé à la page de connexion à chaque clic. On redirige donc http → https.
export function proxy(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && proto === "http") {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
      const url = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${host}`);
      return NextResponse.redirect(url, 308);
    }
  }
  return NextResponse.next();
}

export const config = {
  // Toutes les pages, sauf les fichiers internes de Next.js (déjà servis après la redirection).
  matcher: ["/((?!_next/static|_next/image).*)"],
};
