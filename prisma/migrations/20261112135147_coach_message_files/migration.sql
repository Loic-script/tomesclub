-- AlterTable
ALTER TABLE "coach_message" ADD COLUMN     "fileKind" TEXT,
ADD COLUMN     "fileMime" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER;
