import NavBar from "@/components/ui/NavBar";
import GlassCard from "@/components/ui/GlassCard";

export interface OnboardingShellProps {
  children: React.ReactNode;
  maxWidth?: "480px" | "640px" | "720px";
  step?: number;
  totalSteps?: number;
}

export default function OnboardingShell({
  children,
  maxWidth = "480px",
  step,
  totalSteps,
}: OnboardingShellProps) {
  const progressPercentage =
    step !== undefined && totalSteps !== undefined && totalSteps > 0
      ? Math.min(100, Math.max(0, (step / totalSteps) * 100))
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-atlas-bg via-[#16213e] to-atlas-bg">
      <NavBar variant="onboarding" />
      <main className="flex items-center justify-center min-h-screen pt-14 px-3 sm:px-4">
        <GlassCard maxWidth={maxWidth}>
          {progressPercentage !== null ? (
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-xs text-atlas-text-secondary">
                <span>
                  Step {step} of {totalSteps}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-atlas-surface">
                <div
                  aria-valuemax={totalSteps}
                  aria-valuemin={1}
                  aria-valuenow={step}
                  className="h-1.5 rounded-full bg-gradient-to-r from-atlas-teal to-atlas-steel transition-all duration-500"
                  role="progressbar"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          ) : null}
          {children}
        </GlassCard>
      </main>
    </div>
  );
}
