-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HomeAssistantConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HomeAssistantConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SensorMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "stepsEntityId" TEXT NOT NULL,
    "weightEntityId" TEXT,
    "distanceEntityId" TEXT,
    "activeMinutesEntityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SensorMapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "HomeAssistantConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyHealthSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "steps" INTEGER NOT NULL,
    "weight" REAL,
    "distanceKm" REAL,
    "activeMinutes" INTEGER,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyHealthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyHealthSnapshot_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "HomeAssistantConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LifetimeStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "totalKm" REAL NOT NULL DEFAULT 0,
    "bestDaySteps" INTEGER NOT NULL DEFAULT 0,
    "bestWeekSteps" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "daysTracked" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LifetimeStat_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "HomeAssistantConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "importedDays" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    CONSTRAINT "SyncJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "HomeAssistantConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SensorMapping_connectionId_key" ON "SensorMapping"("connectionId");

-- CreateIndex
CREATE INDEX "DailyHealthSnapshot_connectionId_date_idx" ON "DailyHealthSnapshot"("connectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHealthSnapshot_userId_connectionId_date_key" ON "DailyHealthSnapshot"("userId", "connectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LifetimeStat_connectionId_key" ON "LifetimeStat"("connectionId");
