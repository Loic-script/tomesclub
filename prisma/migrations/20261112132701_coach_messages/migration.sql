-- CreateTable
CREATE TABLE "coach_message" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromCoach" BOOLEAN NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coach_message_userId_createdAt_idx" ON "coach_message"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "coach_message_fromCoach_readAt_idx" ON "coach_message"("fromCoach", "readAt");

-- AddForeignKey
ALTER TABLE "coach_message" ADD CONSTRAINT "coach_message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
