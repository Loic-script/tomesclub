-- Appels : début réel (compte à rebours) et fin (refusé, annulé, terminé)
ALTER TABLE "call" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "call" ADD COLUMN "endedAt" TIMESTAMP(3);

-- Les anciens appels comptent comme "commencés" (on ne sait pas mieux).
UPDATE "call" SET "startedAt" = "createdAt";
