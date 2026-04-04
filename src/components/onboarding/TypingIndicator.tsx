"use client";

import OracleAvatar from "./OracleAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <OracleAvatar size="sm" />
      <div className="bg-glass border border-glass-border rounded-2xl rounded-bl-sm px-4 py-3 inline-flex gap-1.5 items-center">
        <span className="w-2 h-2 rounded-full bg-atlas-teal/60 animate-oracle-dot" />
        <span className="w-2 h-2 rounded-full bg-atlas-teal/60 animate-oracle-dot" style={{ animationDelay: "0.15s" }} />
        <span className="w-2 h-2 rounded-full bg-atlas-teal/60 animate-oracle-dot" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}
