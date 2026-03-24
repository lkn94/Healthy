-- CreateTable
CREATE TABLE "CollectionModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredEnergy" INTEGER NOT NULL,
    "requiredAutomation" INTEGER NOT NULL,
    "requiredAI" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionModule_key_key" ON "CollectionModule"("key");
