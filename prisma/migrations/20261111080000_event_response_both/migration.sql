-- Going ET Interested en même temps : la clé inclut maintenant le statut.
ALTER TABLE "event_response" DROP CONSTRAINT "event_response_pkey",
ADD CONSTRAINT "event_response_pkey" PRIMARY KEY ("eventId", "userId", "status");
