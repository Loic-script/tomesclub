-- CreateTable
CREATE TABLE "room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_queue" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_queue_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "room_createdById_idx" ON "room"("createdById");

-- CreateIndex
CREATE INDEX "event_kind_startsAt_idx" ON "event"("kind", "startsAt");

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_queue" ADD CONSTRAINT "match_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
