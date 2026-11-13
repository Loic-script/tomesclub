-- Les bannis d'un room ou d'un événement
CREATE TABLE "room_ban" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "room_ban_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "room_ban_kind_targetId_userId_key" ON "room_ban"("kind", "targetId", "userId");
