-- CreateTable
CREATE TABLE "DailyChallengeProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "challengeId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeProgress_userId_date_challengeId_key" ON "DailyChallengeProgress"("userId", "date", "challengeId");
