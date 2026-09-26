-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "WorkspaceStatus" NOT NULL DEFAULT 'PLANNING';
