-- AlterTable
ALTER TABLE "room" ALTER COLUMN "createdById" DROP NOT NULL;

-- CreateTable
CREATE TABLE "custom_activity" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "formats" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_activity_key_key" ON "custom_activity"("key");
