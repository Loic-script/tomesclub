-- Le guide "How it works"
ALTER TABLE "profile" ADD COLUMN "guideSeenAt" TIMESTAMP(3);
-- Les membres déjà inscrits ne le voient pas s'ouvrir tout seul (seulement les nouveaux).
UPDATE "profile" SET "guideSeenAt" = CURRENT_TIMESTAMP WHERE "completedAt" IS NOT NULL;

CREATE TABLE "guide_step" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guide_step_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "guide_step_position_idx" ON "guide_step"("position");
