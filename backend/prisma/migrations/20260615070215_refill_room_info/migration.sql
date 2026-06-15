-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'ALMOST_FULL', 'FULL');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "street" VARCHAR(150),
ADD COLUMN     "ward" VARCHAR(100);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashedRefreshToken" TEXT;
