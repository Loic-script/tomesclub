-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "notifyFollows" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyRooms" BOOLEAN NOT NULL DEFAULT true;
