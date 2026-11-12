-- AlterTable
ALTER TABLE "event" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" INTEGER;

-- "Going" devient "registered" (inscrit). "Interested" n'existe plus.
DELETE FROM "event_response" WHERE "status" = 'interested';
UPDATE "event_response" SET "status" = 'registered' WHERE "status" = 'going';
