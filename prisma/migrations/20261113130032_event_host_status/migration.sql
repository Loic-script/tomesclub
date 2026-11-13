-- AlterTable
ALTER TABLE "event" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published';

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
