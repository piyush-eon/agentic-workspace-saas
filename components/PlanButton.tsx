"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SubscriptionDetailsButton, useSubscription } from "@clerk/nextjs/experimental";
import { getActivePromptUsage } from "@/actions/usage";
import { useUpgradeDialog } from "@/components/UpgradeDialog";

type Usage = Awaited<ReturnType<typeof getActivePromptUsage>>;

const USAGE_CHANGED_EVENT = "outpost:prompt-usage-changed";

// Called after an agent response, so the header count stays current without a reload.
export function refreshPromptUsage() {
  window.dispatchEvent(new Event(USAGE_CHANGED_EVENT));
}

// Header pill for the current context (personal account or the selected org): the plan name and
// this month's agent prompts. Free plans get an Upgrade segment; paid plans open their subscription
// details for members allowed to manage billing. `upgradeOnlyWhenOut` hides the Upgrade segment
// until the prompts run out, for tighter spaces like the workspace header.
export function PlanButton({ upgradeOnlyWhenOut = false }: { upgradeOnlyWhenOut?: boolean }) {
  const { orgId, has } = useAuth();
  const payerType = orgId ? "organization" : "user";
  const { data: subscription } = useSubscription({ for: payerType });
  const [usage, setUsage] = useState<Usage>(null);
  const openUpgrade = useUpgradeDialog();

  // Refetch when switching between the personal account and an org, and after agent responses.
  useEffect(() => {
    let cancelled = false;
    const load = () => getActivePromptUsage().then((next) => !cancelled && setUsage(next));
    load();
    window.addEventListener(USAGE_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(USAGE_CHANGED_EVENT, load);
    };
  }, [orgId]);

  if (!usage) return null;

  const { used, limit, isPaid } = usage;
  const isOut = used >= limit;
  const planName =
    subscription?.subscriptionItems.find((item) => item.status === "active" && !item.plan.isDefault)?.plan.name ??
    "Free";

  const upgrade = () =>
    openUpgrade({
      title: isOut ? "You're out of agent prompts" : "Get more agent prompts",
      description: `You've used ${used} of ${limit} prompts this month. Upgrade for more.`,
    });

  const usageButton = (
    <button
      type="button"
      title={`${used.toLocaleString()} of ${limit.toLocaleString()} agent prompts used this month`}
      onClick={isPaid ? undefined : upgrade}
      className="flex h-full items-center gap-2.5 px-3 transition-colors hover:bg-white/5"
    >
      <span className="font-medium text-foreground">{planName}</span>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
        <span
          className={`block h-full rounded-full ${isOut ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
      </span>
      <span className="text-muted-foreground tabular-nums">
        {used.toLocaleString()}/{limit.toLocaleString()}
      </span>
    </button>
  );

  const canManage = isPaid && (!orgId || has?.({ permission: "org:sys_billing:manage" }));

  return (
    <div className="flex h-8 items-center overflow-hidden rounded-full border border-white/10 bg-white/3 text-xs">
      {canManage ? <SubscriptionDetailsButton for={payerType}>{usageButton}</SubscriptionDetailsButton> : usageButton}
      {!isPaid && (!upgradeOnlyWhenOut || isOut) && (
        <button
          type="button"
          onClick={upgrade}
          className="h-full border-l border-white/10 px-3 font-medium text-primary transition-colors hover:bg-primary/10"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
