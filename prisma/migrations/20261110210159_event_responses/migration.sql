-- CreateTable
CREATE TABLE "event_response" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_response_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateIndex
CREATE INDEX "event_response_userId_idx" ON "event_response"("userId");

-- AddForeignKey
ALTER TABLE "event_response" ADD CONSTRAINT "event_response_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_response" ADD CONSTRAINT "event_response_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
