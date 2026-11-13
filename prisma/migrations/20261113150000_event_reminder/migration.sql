-- Rappel 24 h avant un événement : envoyé une seule fois
ALTER TABLE "event" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
