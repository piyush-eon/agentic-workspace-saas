-- DropForeignKey
ALTER TABLE "Surface" DROP CONSTRAINT "Surface_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_surfaceId_fkey";

-- DropIndex
DROP INDEX "Workspace_clerkOrgId_key";

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "clerkOrgId" DROP NOT NULL;

-- DropTable
DROP TABLE "Surface";

-- DropTable
DROP TABLE "Task";

-- DropEnum
DROP TYPE "SurfaceType";

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "Doc" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Canvas" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Canvas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doc_workspaceId_key" ON "Doc"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Canvas_workspaceId_key" ON "Canvas"("workspaceId");

-- AddForeignKey
ALTER TABLE "Doc" ADD CONSTRAINT "Doc_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Canvas" ADD CONSTRAINT "Canvas_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

