-- AlterTable
ALTER TABLE "DailyHealthSnapshot" ADD COLUMN "calories" INTEGER;

-- AlterTable
ALTER TABLE "SensorMapping" ADD COLUMN "caloriesEntityId" TEXT;
