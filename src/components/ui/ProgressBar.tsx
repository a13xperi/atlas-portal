export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  return (
    <div className="flex gap-2 w-full">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i < currentStep ? "bg-atlas-teal" : "bg-atlas-surface"
          }`}
        />
      ))}
    </div>
  );
}
