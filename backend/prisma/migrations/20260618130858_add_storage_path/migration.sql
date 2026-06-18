-- AlterTable
ALTER TABLE "RoomImage" ADD COLUMN     "storagePath" TEXT;

-- CreateIndex
CREATE INDEX "RoomImage_roomId_idx" ON "RoomImage"("roomId");
