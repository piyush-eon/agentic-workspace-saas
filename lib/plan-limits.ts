// Free-plan limits and the upgrade dialog's messages, shared by server checks and client UI.
// Paid limits come from Clerk plan features (see lib/billing.ts).

export const FREE_WORKSPACE_LIMIT = 3;
export const FREE_MONTHLY_PROMPTS = 20;

// Returned by /api/agent when the owner's monthly prompts are used up.
export const PROMPT_LIMIT_ERROR = "prompt_limit_reached";

export const UPGRADE_REASONS = {
  prompts: {
    title: "You're out of agent prompts",
    description: "This workspace's plan has used all its prompts for this month. Upgrade for more.",
  },
  workspaces: {
    title: `You've reached ${FREE_WORKSPACE_LIMIT} workspaces`,
    description: `The free plan includes ${FREE_WORKSPACE_LIMIT} workspaces. Upgrade for unlimited workspaces.`,
  },
  sharing: {
    title: "Public links are a paid feature",
    description: "Upgrade to share a read-only link to this workspace with anyone.",
  },
  pdfExport: {
    title: "PDF export is a paid feature",
    description: "Upgrade to export this workspace's doc and canvas as PDFs.",
  },
};

export type LimitError = keyof typeof UPGRADE_REASONS;
