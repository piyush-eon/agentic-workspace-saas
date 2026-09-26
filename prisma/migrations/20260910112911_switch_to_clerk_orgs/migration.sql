-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_userId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_ownerId_fkey";

-- DropIndex
DROP INDEX "Workspace_ownerId_idx";

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "ownerId",
ADD COLUMN     "clerkOrgId" TEXT,
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Member";

-- DropEnum
DROP TYPE "MemberRole";

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_clerkOrgId_key" ON "Workspace"("clerkOrgId");

-- CreateIndex
CREATE INDEX "Workspace_creatorId_idx" ON "Workspace"("creatorId");

-- CreateIndex
CREATE INDEX "Workspace_clerkOrgId_idx" ON "Workspace"("clerkOrgId");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

