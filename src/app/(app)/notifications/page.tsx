import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import {
  getNotificationSettings,
  listMyNotifications,
  type MemberNotification,
} from "@/lib/notifications";
import { requireMember } from "@/lib/session";
import { clearAllAction, markAllReadAction, toggleSettingAction } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

// Page /notifications : tout ce que le club a à me dire, et mes réglages.
export default function NotificationsPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <NotificationsHome />
    </Suspense>
  );
}

async function NotificationsHome() {
  const user = await requireMember();
  const [notifications, settings] = await Promise.all([
    listMyNotifications(user.id),
    getNotificationSettings(user.id),
  ]);
  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <>
      <PageHeader
        bell={false}
        title="Notifications"
        subtitle={
          unread > 0
            ? `${unread} new ${unread === 1 ? "message" : "messages"}`
            : "You are up to date"
        }
        right={
          unread > 0 ? (
            <form action={markAllReadAction}>
              <button
                type="submit"
                className="neu-sm neu-btn rounded-full px-4 py-2 text-xs font-semibold text-white"
              >
                Mark all read
              </button>
            </form>
          ) : undefined
        }
      />

      <div className="space-y-5">
        {/* ----- Les réglages : je choisis ce que je veux recevoir ----- */}
        <GlassCard className="anim-rise" style={delay(100)}>
          <h2 className="font-display text-lg font-bold text-white">Settings</h2>
          <p className="mt-1 text-xs text-white/55">Choose what you want to be told about.</p>

          <div className="mt-4 space-y-3">
            <SettingRow
              field="notifyCalls"
              label="Video calls"
              hint="When a member calls you"
              value={settings.notifyCalls}
              icon={<PhoneIcon />}
            />
            <SettingRow
              field="notifyEvents"
              label="Events and news"
              hint="New classes and announcements from the coach"
              value={settings.notifyEvents}
              icon={<CalendarIcon />}
            />
          </div>
        </GlassCard>

        {/* ----- La liste ----- */}
        {notifications.length === 0 ? (
          <GlassCard className="anim-rise text-center" style={delay(180)}>
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/10 text-white/70">
              <BellIcon className="size-7" />
            </span>
            <p className="mt-3 font-semibold text-white">Nothing yet</p>
            <p className="mt-1 text-sm text-white/55">Calls and new events will show up here.</p>
          </GlassCard>
        ) : (
          <>
            <ul className="space-y-3">
              {notifications.map((notification, index) => (
                <li
                  key={notification.id}
                  className="anim-rise"
                  style={delay(180 + Math.min(index, 8) * 50)}
                >
                  <NotificationCard notification={notification} />
                </li>
              ))}
            </ul>

            <form action={clearAllAction} className="pt-1 text-center">
              <button
                type="submit"
                className="rounded-full px-4 py-2 text-xs font-semibold text-white/50 transition hover:text-white"
              >
                Clear all
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}

/** Une carte de notification (cliquable si elle a un lien). */
function NotificationCard({ notification }: { notification: MemberNotification }) {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(notification.createdAt);

  const inside = (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
          notification.read ? "bg-white/10 text-white/60" : "bg-brand text-white"
        }`}
      >
        <KindIcon kind={notification.kind} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={`truncate text-sm font-semibold ${
              notification.read ? "text-white/70" : "text-white"
            }`}
          >
            {notification.title}
          </span>
          {!notification.read && (
            <span aria-label="New" className="size-2 shrink-0 rounded-full bg-accent" />
          )}
        </span>
        {notification.body && (
          <span className="mt-0.5 block text-xs text-white/55">{notification.body}</span>
        )}
        <span className="mt-1 block text-[11px] text-white/40">{date}</span>
      </span>
    </>
  );

  const shell = `neu-sm flex items-start gap-3 rounded-3xl p-4 ${
    notification.read ? "" : "ring-1 ring-accent/30"
  }`;

  return notification.link ? (
    <Link href={notification.link} className={`${shell} neu-btn`}>
      {inside}
    </Link>
  ) : (
    <div className={shell}>{inside}</div>
  );
}

/** Un interrupteur de réglage, sans JavaScript : un petit formulaire. */
function SettingRow({
  field,
  label,
  hint,
  value,
  icon,
}: {
  field: "notifyCalls" | "notifyEvents";
  label: string;
  hint: string;
  value: boolean;
  icon: React.ReactNode;
}) {
  return (
    <form action={toggleSettingAction} className="neu-inset flex items-center gap-3 rounded-2xl p-3">
      <input type="hidden" name="field" value={field} />
      {/* On envoie l'inverse de l'état actuel : le bouton bascule le réglage. */}
      <input type="hidden" name="value" value={value ? "off" : "on"} />

      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-[11px] text-white/50">{hint}</span>
      </span>

      <button
        type="submit"
        role="switch"
        aria-checked={value}
        aria-label={`${label}: ${value ? "on" : "off"}`}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
          value ? "bg-brand" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all duration-300 ${
            value ? "left-6" : "left-1"
          }`}
        />
      </button>
    </form>
  );
}

/* Icônes */

const iconProps = {
  viewBox: "0 0 24 24",
  className: "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function KindIcon({ kind }: { kind: string }) {
  if (kind === "call") return <PhoneIcon />;
  if (kind === "event") return <CalendarIcon />;
  return <MegaphoneIcon />;
}

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function BellIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </svg>
  );
}
