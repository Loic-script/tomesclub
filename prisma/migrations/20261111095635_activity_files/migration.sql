-- CreateTable
CREATE TABLE "activity_file" (
    "id" TEXT NOT NULL,
    "activityKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "pdfStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_file_activityKey_idx" ON "activity_file"("activityKey");
