-- AlterEnum
ALTER TYPE "WorkspaceStatus" ADD VALUE 'IN_REVIEW';

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "description" TEXT;
