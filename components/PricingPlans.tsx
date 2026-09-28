"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { CheckoutButton, usePlans, useSubscription } from "@clerk/nextjs/experimental";
import { Button } from "@/components/ui/button";

type PayerType = "user" | "organization";
type Plan = NonNullable<ReturnType<typeof usePlans>["data"]>[number];

const TABS: { value: PayerType; label: string }[] = [
  { value: "user", label: "Personal" },
  { value: "organization", label: "Team" },
];

// Seat-based plans price per member; everything else is a flat monthly fee.
function planPrice(plan: Plan) {
  const seatFee = plan.unitPrices?.find((u) => u.name === "seats")?.tiers[0]?.feePerBlock;
  if (seatFee && seatFee.amount > 0) {
    return { amount: `${seatFee.currencySymbol}${seatFee.amountFormatted}`, unit: "per member / month" };
  }
  if (plan.fee && plan.fee.amount > 0) {
    return { amount: `${plan.fee.currencySymbol}${plan.fee.amountFormatted}`, unit: "per month" };
  }
  return { amount: "$0", unit: "forever" };
}

// Free first, then paid plans from cheapest to most expensive.
function sortPlans(plans: Plan[]) {
  const cost = (plan: Plan) =>
    plan.isDefault ? -1 : (plan.unitPrices?.[0]?.tiers[0]?.feePerBlock.amount ?? plan.fee?.amount ?? 0);
  return [...plans].sort((a, b) => cost(a) - cost(b));
}

// Shared by the pricing page, the landing page and the upgrade dialog. Plans, prices and features
// come from the Clerk dashboard. Paid cards open Clerk's checkout drawer; team plans charge the
// active organization. `onCheckoutStart` lets a container (like a dialog) close before it opens.
export function PricingPlans({
  title,
  description,
  onCheckoutStart,
}: {
  title?: string;
  description?: string;
  onCheckoutStart?: () => void;
}) {
  const { isSignedIn, orgId } = useAuth();
  const [tab, setTab] = useState<PayerType | null>(null);
  // Until the visitor picks a tab, show the plans for where they currently are.
  const payerType = tab ?? (orgId ? "organization" : "user");

  const { data: plans, isLoading } = usePlans({ for: payerType, pageSize: 10 });
  const { data: subscription } = useSubscription({
    for: payerType,
    enabled: !!isSignedIn && (payerType === "user" || !!orgId),
  });
  const activePlanIds = new Set(
    subscription?.subscriptionItems.filter((item) => item.status === "active").map((item) => item.plan.id)
  );
  const sortedPlans = sortPlans(plans ?? []);
  // Only the entry-level paid plan (Pro, or Team) is highlighted, not every paid tier.
  const featuredPlanId = sortedPlans.find((plan) => !plan.isDefault)?.id;

  return (
    // w-full: inside a grid (like the dialog), mx-auto alone would shrink this to fit its content.
    <div className="mx-auto w-full max-w-5xl">
      {title && (
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
          {description && <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="mx-auto mb-10 flex w-fit rounded-full border border-white/10 bg-white/3 p-1">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-5 py-1.5 text-sm transition-colors ${
              payerType === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${sortedPlans.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {isLoading
          ? [0, 1].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl border border-white/8 bg-white/3" />)
          : sortedPlans.map((plan) => {
              const price = planPrice(plan);
              const isPaid = !plan.isDefault;
              const isCurrent =
                activePlanIds.has(plan.id) || (!!isSignedIn && plan.isDefault && activePlanIds.size === 0);
              const isFeatured = plan.id === featuredPlanId;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-7 ${
                    isFeatured
                      ? "border-primary/40 bg-primary/4 shadow-2xl shadow-primary/5"
                      : "border-white/10 bg-white/2"
                  }`}
                >
                  {/* Sits centered on the card's top border. */}
                  {isFeatured && payerType === "organization" && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/20">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {isCurrent && (
                      <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-muted-foreground">
                        Current plan
                      </span>
                    )}
                  </div>
                  {plan.description && <p className="mt-1.5 text-sm text-muted-foreground">{plan.description}</p>}

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-heading text-4xl font-semibold tracking-tight">{price.amount}</span>
                    <span className="text-sm text-muted-foreground">{price.unit}</span>
                  </div>

                  <ul className="mt-6 mb-8 flex-1 space-y-2.5">
                    {plan.features.length === 0 ? (
                      <li className="text-sm text-muted-foreground">The core workspace: docs, canvas and the agent</li>
                    ) : (
                      plan.features.map((feature) => (
                        <li key={feature.id} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          {feature.name}
                        </li>
                      ))
                    )}
                  </ul>

                  <PlanAction
                    plan={plan}
                    payerType={payerType}
                    isPaid={isPaid}
                    isFeatured={isFeatured}
                    isCurrent={isCurrent}
                    onCheckoutStart={onCheckoutStart}
                  />
                </div>
              );
            })}
      </div>
    </div>
  );
}

function PlanAction({
  plan,
  payerType,
  isPaid,
  isFeatured,
  isCurrent,
  onCheckoutStart,
}: {
  plan: Plan;
  payerType: PayerType;
  isPaid: boolean;
  isFeatured: boolean;
  isCurrent: boolean;
  onCheckoutStart?: () => void;
}) {
  const { isSignedIn, orgId, has } = useAuth();
  const { organization } = useOrganization();

  if (!isSignedIn) {
    return (
      <Button asChild size="lg" variant={isFeatured ? "default" : "outline"} className="w-full">
        <Link href="/sign-up">{isPaid ? `Get ${plan.name}` : "Get started"}</Link>
      </Button>
    );
  }

  if (isCurrent || !isPaid) {
    return (
      <Button size="lg" variant="outline" className="w-full" disabled>
        {isCurrent ? "Current plan" : "Included"}
      </Button>
    );
  }

  if (payerType === "organization") {
    if (!orgId) {
      return <Note>Select or create a team in the header to upgrade it.</Note>;
    }
    // Clerk only lets members with the billing permission (admins by default) manage the plan.
    if (!has?.({ permission: "org:sys_billing:manage" })) {
      return <Note>Ask an admin of {organization?.name ?? "your team"} to upgrade.</Note>;
    }
  }

  return (
    <div className="space-y-2">
      {payerType === "organization" && organization && (
        <p className="text-center text-xs text-muted-foreground">
          Upgrading <span className="text-foreground">{organization.name}</span>
        </p>
      )}
      {/* CheckoutButton runs this button's onClick first, then opens Clerk's checkout drawer. */}
      <CheckoutButton planId={plan.id} planPeriod="month" for={payerType}>
        <Button size="lg" variant={isFeatured ? "default" : "outline"} className="w-full" onClick={onCheckoutStart}>
          Upgrade to {plan.name}
        </Button>
      </CheckoutButton>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-white/10 bg-white/3 px-4 py-3 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
