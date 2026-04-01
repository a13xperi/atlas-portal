"use client";

import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-atlas-bg px-4">
      <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8 max-w-md w-full text-center">
        <p className="font-heading text-6xl text-atlas-teal mb-2">404</p>

        <h2 className="font-heading text-xl text-atlas-text mb-2">
          Page not found
        </h2>

        <p className="text-atlas-text-secondary text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-atlas-teal to-atlas-steel text-white text-sm font-medium rounded-lg hover:scale-105 transition-transform"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>

          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 text-atlas-text-secondary text-sm hover:text-atlas-teal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
