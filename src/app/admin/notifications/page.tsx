import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { listAdminNotifications, type AdminNotificationItem } from "@/lib/admin-notifications";
import { BellIcon, CheckIcon, KindIcon, kindTone, TrashIcon } from "../admin-icons";
import { AdminHeader, delay, EmptyState, Panel, timeAgo } from "../admin-ui";
import { clearAdminNotificationsAction, markAllAdminReadAction } from "./actions";

export const metadata: Metadata = { title: "Notifications · Admin" };

// Page /admin/notifications : tout ce qui s'est passé dans le club.
export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <Inbox />
    </Suspense>
  );
}

/** Range les notifications par jour : Today, Yesterday, puis la date. */
function groupByDay(items: AdminNotificationItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const format = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const groups: { label: string; items: AdminNotificationItem[] }[] = [];
  for (const item of items) {
    const label =
      item.createdAt >= today
        ? "Today"
        : item.createdAt >= yesterday
          ? "Yesterday"
          : format.format(item.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

const KIND_LABEL: Record<string, string> = {
  signup: "New account",
  member: "Profile",
  room: "Room",
  event: "Event",
  call: "Call",
};

async function Inbox() {
  await requireAdmin();
  const items = await listAdminNotifications(100);
  const unread = items.filter((item) => !item.read).length;
  const groups = groupByDay(items);

  return (
    <div className="mx-auto max-w-3xl">
      <AdminHeader
        eyebrow="Inbox"
        bell={false}
        title="Notifications"
        subtitle={
          unread > 0
            ? `${unread} new ${unread === 1 ? "notification" : "notifications"}`
            : "You are up to date"
        }
        right={
          <>
            {unread > 0 && (
              <form action={markAllAdminReadAction}>
                <button
                  type="submit"
                  className="neu-sm neu-btn flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white"
                >
                  <CheckIcon className="size-3.5" />
                  Mark all read
                </button>
              </form>
            )}
            {items.length > 0 && (
              <form action={clearAdminNotificationsAction}>
                <button
                  type="submit"
                  aria-label="Clear all notifications"
                  title="Clear all"
                  className="neu-sm neu-btn flex size-10 items-center justify-center rounded-full text-white/60 hover:text-red-300"
                >
                  <TrashIcon />
                </button>
              </form>
            )}
          </>
        }
      />

      {items.length === 0 ? (
        <Panel style={delay(100)}>
          <EmptyState
            icon={<BellIcon className="size-7" />}
            title="Nothing yet"
            text="You will be told here when someone creates an account, opens a room, starts a call or answers an event."
          />
        </Panel>
      ) : (
        <div className="space-y-7">
          {groups.map((group, groupIndex) => (
            <section key={group.label} className="anim-rise" style={delay(100 + groupIndex * 60)}>
              <h2 className="mb-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                {group.label}
                <span aria-hidden className="h-px flex-1 bg-white/10" />
              </h2>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NotificationRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ item }: { item: AdminNotificationItem }) {
  const inside = (
    <>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${kindTone(item.kind)} text-white shadow-lg shadow-black/20 ${item.read ? "opacity-60" : ""}`}
      >
        <KindIcon kind={item.kind} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            {KIND_LABEL[item.kind] ?? "Update"}
          </span>
          {!item.read && <span aria-label="New" className="size-1.5 rounded-full bg-accent" />}
        </span>
        <span className={`mt-0.5 block text-sm font-semibold ${item.read ? "text-white/70" : "text-white"}`}>
          {item.title}
        </span>
        {item.body && <span className="mt-0.5 block text-xs text-white/50">{item.body}</span>}
      </span>
      <span className="shrink-0 self-start pt-1 text-[11px] text-white/40">{timeAgo(item.createdAt)}</span>
    </>
  );

  const shell = `neu-sm flex items-center gap-4 rounded-3xl p-4 ${item.read ? "" : "ring-1 ring-accent/30"}`;
  return item.link ? (
    <Link href={item.link} className={`${shell} neu-btn`}>
      {inside}
    </Link>
  ) : (
    <div className={shell}>{inside}</div>
  );
}
