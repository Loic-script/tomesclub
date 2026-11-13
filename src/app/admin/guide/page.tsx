import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { getGuideSteps } from "@/lib/guide";
import { AdminHeader } from "../admin-ui";
import { GuideEditor } from "./guide-editor";

export const metadata: Metadata = { title: "Guide · Admin" };

// Page /admin/guide : modifier la fenêtre "How it works" que les membres voient sur Home.
export default function AdminGuidePage() {
  return (
    <>
      <AdminHeader
        eyebrow="Guide"
        title="App guide"
        subtitle="The “How it works” window on the members' Home page. New members see it once, right after they finish their profile. Everyone can open it again with the ? button."
      />
      <Suspense
        fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}
      >
        <Editor />
      </Suspense>
    </>
  );
}

async function Editor() {
  await requireAdmin();
  const steps = await getGuideSteps();
  return <GuideEditor initial={steps} />;
}
