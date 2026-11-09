import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { GoogleSignInButton } from "./google-button";

export const metadata: Metadata = { title: "Sign in" };

/** Règle le retard d'une animation d'entrée (variable --d du CSS). */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Page de connexion : carte en deux parties, animée à l'arrivée.
// À gauche la marque et des bulles de conversation en anglais ; à droite le bouton Google.
export default function LoginPage() {
  return (
    <div
      className="anim-rise grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 md:min-h-[540px] md:grid-cols-2"
      style={delay(0)}
    >
      {/* ----- Panneau de gauche : la marque ----- */}
      <section className="relative overflow-hidden px-8 py-14 text-center text-white md:flex md:flex-col md:items-center md:justify-center md:px-10">
        {/* Photo du coach en arrière-plan */}
        <Image
          src="/coach.png"
          alt=""
          fill
          sizes="(min-width: 768px) 28rem, 100vw"
          className="object-cover object-top"
        />
        {/* Voile bordeaux doux par-dessus la photo (la palette reste maîtresse) */}
        <div
          aria-hidden
          className="anim-gradient absolute inset-0 bg-[linear-gradient(135deg,rgba(122,8,46,0.92),rgba(156,11,59,0.78)_45%,rgba(179,19,75,0.72)_72%,rgba(122,8,46,0.9))]"
        />

        {/* Ronds doux en fond, pour la profondeur */}
        <div aria-hidden className="absolute -left-16 -top-16 size-48 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -bottom-20 -left-8 size-56 rounded-full bg-white/5" />

        {/* Bord ondulé entre les deux panneaux (sur grand écran) */}
        <svg
          aria-hidden
          viewBox="0 0 100 800"
          preserveAspectRatio="none"
          className="absolute inset-y-0 right-0 hidden h-full w-14 text-white md:block"
        >
          <path
            fill="currentColor"
            d="M100 0 H62 C30 70 92 150 58 230 C28 300 88 380 56 460 C26 540 90 620 54 700 C38 748 52 776 66 800 H100 Z"
          />
        </svg>

        {/* Les bulles : ce qu'on vient faire au club — parler anglais */}
        <SpeechBubble style={delay(900)} className="left-6 top-10 -rotate-2">
          Hello!
        </SpeechBubble>
        <SpeechBubble style={delay(1050)} className="right-20 top-9 rotate-2 max-md:hidden">
          Nice to meet you!
        </SpeechBubble>
        <SpeechBubble style={delay(1200)} className="bottom-4 left-8 rotate-1 md:bottom-20 md:left-10">
          Let&apos;s talk!
        </SpeechBubble>

        <div className="relative flex flex-col items-center gap-4">
          <p className="anim-rise text-xs font-semibold uppercase tracking-[0.35em] text-white/80" style={delay(150)}>
            Welcome to
          </p>

          <div className="anim-pop relative" style={delay(300)}>
            {/* Halo orange qui respire, clin d'œil à l'anneau du logo */}
            <span aria-hidden className="anim-halo absolute -inset-3 rounded-3xl bg-accent/50 blur-xl" />
            {/* Logo carré aux coins doux, sans bordure */}
            <Image
              src="/logo.jpeg"
              alt="Tomes Club logo"
              width={112}
              height={112}
              preload
              className="relative rounded-2xl shadow-lg"
            />
          </div>

          <h2 className="anim-rise font-display text-4xl font-bold tracking-tight md:text-5xl" style={delay(450)}>
            Tomes Club
          </h2>

          <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-white/90" style={delay(560)}>
            Motivate <Dot /> Activate <Dot /> Develop
          </p>

          <p className="anim-rise max-w-xs text-sm leading-6 text-white/75" style={delay(670)}>
            Live English classes with Coach Rindra, wherever you are.
          </p>
        </div>
      </section>

      {/* ----- Panneau de droite : la connexion ----- */}
      <section className="flex flex-col items-center justify-center px-8 py-12 md:px-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="anim-rise" style={delay(500)}>
            <h1 className="font-display text-3xl font-bold text-navy">Sign in</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              One click with your Google account, and your class is waiting.
            </p>
          </div>

          <div className="anim-rise" style={delay(650)}>
            <GoogleSignInButton />
          </div>

          <p className="anim-rise text-xs leading-5 text-zinc-500" style={delay(800)}>
            No password to remember — Google keeps your account safe. By signing in, you agree to
            the Tomes Club <span className="font-medium text-brand">Terms &amp; Conditions</span>.
          </p>
        </div>
      </section>
    </div>
  );
}

/** Petite bulle de conversation qui flotte sur le panneau bordeaux. */
function SpeechBubble({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className: string;
  style: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={`anim-bubble absolute select-none rounded-2xl rounded-bl-sm bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 shadow-sm backdrop-blur-sm ${className}`}
    >
      {children}
    </span>
  );
}

/** Point orange entre les mots de la devise. */
function Dot() {
  return <span className="text-accent">·</span>;
}
