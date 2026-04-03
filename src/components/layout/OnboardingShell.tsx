import NavBar from "@/components/ui/NavBar";
import GlassCard from "@/components/ui/GlassCard";

export interface OnboardingShellProps {
  children: React.ReactNode;
  maxWidth?: "480px" | "640px" | "720px";
}

export default function OnboardingShell({
  children,
  maxWidth = "480px",
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
      <NavBar variant="onboarding" />
      <main className="flex items-center justify-center min-h-screen pt-14 px-3 sm:px-4">
        <GlassCard maxWidth={maxWidth}>{children}</GlassCard>
      </main>
    </div>
  );
}
