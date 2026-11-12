-- AlterTable
ALTER TABLE "room" ADD COLUMN     "pendingApproval" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "room_invite" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_invite_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateIndex
CREATE INDEX "room_invite_userId_idx" ON "room_invite"("userId");

-- AddForeignKey
ALTER TABLE "room_invite" ADD CONSTRAINT "room_invite_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_invite" ADD CONSTRAINT "room_invite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
