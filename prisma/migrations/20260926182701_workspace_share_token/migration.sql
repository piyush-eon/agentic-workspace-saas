-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_shareToken_key" ON "Workspace"("shareToken");
