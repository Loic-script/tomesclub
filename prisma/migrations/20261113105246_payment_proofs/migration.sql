-- AlterTable
ALTER TABLE "event_response" ADD COLUMN     "paymentProofId" TEXT,
ADD COLUMN     "paymentRef" TEXT;

-- AlterTable
ALTER TABLE "room" ADD COLUMN     "paymentProofId" TEXT;

-- CreateTable
CREATE TABLE "payment_proof" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_proof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_proof_userId_idx" ON "payment_proof"("userId");

-- AddForeignKey
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
