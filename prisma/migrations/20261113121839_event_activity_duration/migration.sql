-- AlterTable
ALTER TABLE "event" ADD COLUMN     "activity" TEXT,
ADD COLUMN     "durationMin" INTEGER,
ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "topic" TEXT;
