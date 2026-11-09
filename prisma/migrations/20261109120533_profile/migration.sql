-- CreateTable
CREATE TABLE "profile" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "country" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "occupations" JSONB,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "englishLevel" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photo" BYTEA,
    "photoType" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
