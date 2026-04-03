import Link from "next/link";
import GradientButton from "@/components/ui/GradientButton";
import { gradients } from "@/lib/tokens";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: gradients.appBg }}
    >
      <div className="text-center">
        <p className="bg-gradient-to-r from-atlas-teal via-atlas-steel to-atlas-teal bg-clip-text font-heading text-[120px] font-bold leading-none text-transparent">
          404
        </p>
        <h1 className="mt-4 font-heading text-2xl text-atlas-text">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-md text-atlas-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8">
          <Link href="/dashboard" className="inline-block">
            <GradientButton asChild>Back to Dashboard</GradientButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
