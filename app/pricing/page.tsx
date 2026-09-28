import type { Metadata } from "next";
import { PricingPlans } from "@/components/PricingPlans";

export const metadata: Metadata = {
  title: "Pricing | Outpost",
  description: "Free to start. Upgrade yourself or your whole team when you need more.",
};

export default function PricingPage() {
  return (
    <div className="topo-bg px-6 py-16 md:px-10">
      <PricingPlans
        title="Simple pricing"
        description="Start free. Upgrade just yourself, or your whole team, billed per member."
      />
    </div>
  );
}
