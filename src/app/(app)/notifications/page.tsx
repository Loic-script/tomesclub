import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ActionForm } from "@/components/action-form";
import { Card, delay, EmptyState, PageHeader, PageSkeleton } from "@/components/app-ui";
import {
  BellIcon,
  CalendarIcon,
  ChevronIcon,
  MegaphoneIcon,
  PeopleIcon,
  PhoneIcon,
  SettingsIcon,
  UserPlusIcon,
} from "@/components/icons";
import {
  getNotificationSettings,
  listMyNotifications,
  type MemberNotification,
  type NotificationSetting,
} from "@/lib/notifications";
import { requireMember } from "@/lib/session";
import { clearAllAction, markAllReadAction, toggleSettingAction } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

// Page /notifications : l'historique (à gauche) et mes préférences (à droite).
export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
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
        title="Notifications"
        subtitle={
          unread > 0
            ? `${unread} new ${unread === 1 ? "notification" : "notifications"}`
            : "You are up to date."
        }
        actions={
          <a href="#preferences" className="btn btn-secondary xl:hidden">
            <SettingsIcon className="size-4" />
            Preferences
          </a>
        }
      />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_var(--spacing-rail)]">
        {/* ----- L'historique ----- */}
        <section aria-labelledby="activity-title" className="anim-rise min-w-0" style={delay(80)}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="activity-title" className="font-display text-lg font-semibold text-ink">
              Activity
            </h2>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <ActionForm action={markAllReadAction}>
                    <button type="submit" className="btn btn-ghost btn-sm text-brand hover:text-brand">
                      Mark all read
                    </button>
                  </ActionForm>
                )}
                <ActionForm action={clearAllAction}>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Clear all
                  </button>
                </ActionForm>
              </div>
            )}
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              icon={<BellIcon />}
              title="Nothing yet"
              description="Calls, new followers, rooms and events will show up here."
            />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-line">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationRow notification={notification} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {/* ----- Les préférences ----- */}
        <aside
          id="preferences"
          aria-labelledby="preferences-title"
          className="anim-rise min-w-0 scroll-mt-24 xl:sticky xl:top-10"
          style={delay(140)}
        >
          <Card>
            <h2 id="preferences-title" className="font-display text-lg font-semibold text-ink">
              Preferences
            </h2>
            <p className="mt-1 text-sm text-mute">Choose what you want to be told about.</p>

            <div className="mt-5 divide-y divide-line">
              <SettingRow
                field="notifyCalls"
                label="Video calls"
                hint="When a member calls you"
                value={settings.notifyCalls}
                icon={<PhoneIcon className="size-4" />}
              />
              <SettingRow
                field="notifyFollows"
                label="New followers"
                hint="When a member starts following you"
                value={settings.notifyFollows}
                icon={<UserPlusIcon className="size-4" />}
              />
              <SettingRow
                field="notifyRooms"
                label="Group rooms"
                hint="When a member opens a public room"
                value={settings.notifyRooms}
                icon={<PeopleIcon className="size-4" />}
              />
              <SettingRow
                field="notifyEvents"
                label="Events and news"
                hint="New classes and announcements from the coach"
                value={settings.notifyEvents}
                icon={<CalendarIcon className="size-4" />}
              />
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

/** Une ligne de l'historique (cliquable si elle a un lien). */
function NotificationRow({ notification }: { notification: MemberNotification }) {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(notification.createdAt);

  const inside = (
    <>
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          notification.read ? "bg-blush text-mute" : "bg-brand text-white"
        }`}
      >
        <KindIcon kind={notification.kind} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={`min-w-0 break-words text-sm ${
              notification.read ? "font-medium text-ink/80" : "font-semibold text-ink"
            }`}
          >
            {notification.title}
          </span>
          <time
            dateTime={notification.createdAt.toISOString()}
            className="shrink-0 pt-0.5 text-xs text-mute"
          >
            {date}
          </time>
        </span>
        {notification.body && (
          <span className="mt-0.5 block text-sm text-mute">{notification.body}</span>
        )}
      </span>

      {!notification.read && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand">
          <span className="sr-only">New</span>
        </span>
      )}
      {notification.link && <ChevronIcon className="mt-1 size-4 text-mute" />}
    </>
  );

  const row = `flex items-start gap-4 px-4 py-4 sm:px-5 ${notification.read ? "" : "bg-brand-50/50"}`;

  return notification.link ? (
    <Link href={notification.link} className={`${row} transition-colors hover:bg-blush/60`}>
      {inside}
    </Link>
  ) : (
    <div className={row}>{inside}</div>
  );
}

/** Un interrupteur de réglage : un petit formulaire (puis la page se rafraîchit). */
function SettingRow({
  field,
  label,
  hint,
  value,
  icon,
}: {
  field: NotificationSetting;
  label: string;
  hint: string;
  value: boolean;
  icon: ReactNode;
}) {
  return (
    <ActionForm action={toggleSettingAction} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      <input type="hidden" name="field" value={field} />
      {/* On envoie l'inverse de l'état actuel : le bouton bascule le réglage. */}
      <input type="hidden" name="value" value={value ? "off" : "on"} />

      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
          value ? "bg-brand-50 text-brand" : "bg-blush text-mute"
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-mute">{hint}</span>
      </span>

      <button
        type="submit"
        role="switch"
        aria-checked={value}
        aria-label={`${label}: ${value ? "on" : "off"}`}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 group-aria-busy:opacity-60 ${
          value ? "bg-brand hover:bg-brand-700" : "bg-line-strong hover:bg-blush-2"
        }`}
      >
        <span
          aria-hidden
          className={`size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </ActionForm>
  );
}

function KindIcon({ kind }: { kind: string }) {
  if (kind === "call") return <PhoneIcon className="size-4" />;
  if (kind === "follow") return <UserPlusIcon className="size-4" />;
  if (kind === "room") return <PeopleIcon className="size-4" />;
  if (kind === "event") return <CalendarIcon className="size-4" />;
  return <MegaphoneIcon className="size-4" />;
}
