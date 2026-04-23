"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WizardContextValue {
  step: number;
  totalSteps: number;
  goNext: () => void;
  goBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const WizardContext = React.createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = React.useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within a Wizard");
  return ctx;
}

export interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: string[];
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  step?: number;
  onStepChange?: (step: number) => void;
  nextLabel?: string;
  backLabel?: string;
  finalLabel?: string;
  onFinalClick?: () => void | Promise<void>;
  finalLoading?: boolean;
  finalDisabled?: boolean;
  nextDisabled?: boolean;
  hideFooter?: boolean;
}

function WizardRoot({
  open,
  onOpenChange,
  title,
  description,
  steps,
  children,
  size = "md",
  step: controlledStep,
  onStepChange,
  nextLabel = "Continue",
  backLabel = "Back",
  finalLabel = "Create",
  onFinalClick,
  finalLoading,
  finalDisabled,
  nextDisabled,
  hideFooter,
}: WizardProps) {
  const [internalStep, setInternalStep] = React.useState(0);
  const step = controlledStep ?? internalStep;
  const setStep = React.useCallback(
    (next: number) => {
      if (controlledStep === undefined) setInternalStep(next);
      onStepChange?.(next);
    },
    [controlledStep, onStepChange],
  );

  React.useEffect(() => {
    if (!open) {
      setInternalStep(0);
    }
  }, [open]);

  const childArray = React.Children.toArray(children);
  const totalSteps = steps.length;
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  const goNext = React.useCallback(() => {
    if (!isLast) setStep(step + 1);
  }, [isLast, setStep, step]);

  const goBack = React.useCallback(() => {
    if (!isFirst) setStep(step - 1);
  }, [isFirst, setStep, step]);

  const ctxValue: WizardContextValue = {
    step,
    totalSteps,
    goNext,
    goBack,
    isFirst,
    isLast,
  };

  const showStepper = totalSteps > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
          {showStepper ? (
            <div className="mt-3 flex items-center gap-2">
              {steps.map((label, idx) => {
                const active = idx === step;
                const completed = idx < step;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-medium border transition-colors",
                        active
                          ? "border-white bg-white text-zinc-950"
                          : completed
                            ? "border-white/40 bg-white/10 text-white"
                            : "border-border bg-transparent text-white/40",
                      )}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[length:var(--text-xs)] font-medium",
                        active ? "text-white" : "text-white/50",
                      )}
                    >
                      {label}
                    </span>
                    {idx < steps.length - 1 ? (
                      <div className="h-px w-6 bg-border-subtle" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </DialogHeader>
        <WizardContext.Provider value={ctxValue}>
          <DialogBody>{childArray[step] ?? null}</DialogBody>
        </WizardContext.Provider>
        {hideFooter ? null : (
          <DialogFooter>
            {showStepper && !isFirst ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={goBack}
                disabled={finalLoading}
              >
                {backLabel}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={finalLoading}
              >
                Cancel
              </Button>
            )}
            {isLast ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onFinalClick?.()}
                disabled={finalLoading || finalDisabled}
              >
                {finalLoading ? "Working..." : finalLabel}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={goNext}
                disabled={nextDisabled}
              >
                {nextLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WizardStep({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

export const Wizard = Object.assign(WizardRoot, { Step: WizardStep });
