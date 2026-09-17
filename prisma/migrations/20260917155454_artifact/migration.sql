-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('SUMMARY', 'FLASHCARDS', 'QUIZ', 'STUDY_GUIDE', 'GLOSSARY');

-- CreateEnum
CREATE TYPE "ArtifactStatus" AS ENUM ('READY', 'FAILED');

-- CreateTable
CREATE TABLE "artifact" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sourceIds" JSONB NOT NULL,
    "status" "ArtifactStatus" NOT NULL DEFAULT 'READY',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artifact_workspaceId_idx" ON "artifact"("workspaceId");

-- AddForeignKey
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
