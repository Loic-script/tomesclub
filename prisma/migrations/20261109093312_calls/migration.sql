-- CreateTable
CREATE TABLE "call" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_participant" (
    "callId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "call_participant_pkey" PRIMARY KEY ("callId","userId")
);

-- CreateIndex
CREATE INDEX "call_createdById_idx" ON "call"("createdById");

-- CreateIndex
CREATE INDEX "call_participant_userId_idx" ON "call_participant"("userId");

-- AddForeignKey
ALTER TABLE "call" ADD CONSTRAINT "call_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_participant" ADD CONSTRAINT "call_participant_callId_fkey" FOREIGN KEY ("callId") REFERENCES "call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_participant" ADD CONSTRAINT "call_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
