import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-atlas-bg flex items-center justify-center">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-12 text-center max-w-md">
        <p className="font-heading text-6xl text-atlas-teal font-bold">404</p>
        <p className="text-atlas-text-secondary text-lg mt-4">Page not found</p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex bg-gradient-to-r from-atlas-teal to-atlas-steel text-white rounded-lg px-6 py-3 font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
