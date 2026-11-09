import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdmin } from "@/lib/admin";
import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = { title: "Admin sign in" };

// Page /admin/login : l'entrée de l'équipe du club (même fond que la connexion membre).
export default function AdminLoginPage() {
  return (
    <div className="anim-rise w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 sm:p-10">
      <div className="anim-rise mb-6 flex flex-col items-center gap-3 text-center" style={{ "--d": "120ms" } as React.CSSProperties}>
        <Image src="/logo.png" alt="" width={64} height={64} className="rounded-full drop-shadow-md" />
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Admin area</h1>
          <p className="mt-1 text-sm text-zinc-600">Reserved for the Tomes Club team.</p>
        </div>
      </div>

      {/* Déjà connecté comme admin ? Direction le tableau de bord. */}
      <Suspense fallback={<p className="text-center text-sm text-zinc-500">Loading...</p>}>
        <AdminGate />
      </Suspense>

      <p className="anim-rise mt-6 text-center text-xs text-zinc-500" style={{ "--d": "400ms" } as React.CSSProperties}>
        Not the admin?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Member sign in
        </Link>
      </p>
    </div>
  );
}

async function AdminGate() {
  if (await isAdmin()) redirect("/admin");
  return <AdminLoginForm />;
}
