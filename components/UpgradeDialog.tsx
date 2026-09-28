"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PricingPlans } from "@/components/PricingPlans";

type UpgradeReason = { title: string; description?: string };

const DEFAULT_REASON: UpgradeReason = {
  title: "Upgrade your plan",
  description: "Get more agent prompts, unlimited workspaces, share links and PDF export.",
};

const UpgradeDialogContext = createContext<(reason?: UpgradeReason) => void>(() => {});

// Lets any part of the app open the pricing dialog with its own reason, e.g.
// openUpgrade({ title: "You're out of agent prompts" }) or { title: "PDF export is a paid feature" }.
export function UpgradeDialogProvider({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<UpgradeReason | null>(null);
  const close = () => setReason(null);

  return (
    <UpgradeDialogContext.Provider value={(next) => setReason(next ?? DEFAULT_REASON)}>
      {children}
      <Dialog open={reason !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl">{reason?.title}</DialogTitle>
            {reason?.description && <DialogDescription>{reason.description}</DialogDescription>}
          </DialogHeader>
          {/* Close first: this dialog blocks clicks outside itself, including Clerk's checkout drawer. */}
          <PricingPlans onCheckoutStart={close} />
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  );
}

export function useUpgradeDialog() {
  return useContext(UpgradeDialogContext);
}
