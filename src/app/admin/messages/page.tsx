import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { listConversations } from "@/lib/coach-chat";
import { AdminHeader } from "../admin-ui";
import { MessagesBoard } from "./messages-board";

export const metadata: Metadata = { title: "Messages · Admin" };

// Page /admin/messages : discuter avec chaque membre.
// /admin/messages?m=<id du membre> ouvre directement sa discussion.
export default function AdminMessagesPage(props: PageProps<"/admin/messages">) {
  return (
    <>
      <AdminHeader eyebrow="Messages" />
      <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
        <Board searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Board({ searchParams }: { searchParams: PageProps<"/admin/messages">["searchParams"] }) {
  await requireAdmin();
  const [{ m }, conversations] = await Promise.all([searchParams, listConversations()]);
  return <MessagesBoard initial={conversations} initialUser={typeof m === "string" ? m : null} />;
}
