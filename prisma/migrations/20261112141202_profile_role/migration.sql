-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member',
ADD COLUMN     "roleRequest" TEXT;
