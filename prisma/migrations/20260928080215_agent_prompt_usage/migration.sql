-- DropForeignKey
ALTER TABLE "AgentActionLog" DROP CONSTRAINT "AgentActionLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "AgentActionLog" DROP CONSTRAINT "AgentActionLog_workspaceId_fkey";

-- DropTable
DROP TABLE "AgentActionLog";

-- CreateTable
CREATE TABLE "AgentPrompt" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentPrompt_ownerId_createdAt_idx" ON "AgentPrompt"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgentPrompt" ADD CONSTRAINT "AgentPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPrompt" ADD CONSTRAINT "AgentPrompt_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

