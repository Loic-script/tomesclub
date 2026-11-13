-- CreateTable
CREATE TABLE "ring" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT NOT NULL,
    "fromUserId" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ring_userId_createdAt_idx" ON "ring"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ring" ADD CONSTRAINT "ring_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
