"use client";

import { FormEvent, useState } from "react";
import GradientButton from "@/components/ui/GradientButton";

export interface ReplyModeProps {
  creating?: boolean;
  onSubmit?: (replyContext: string) => Promise<boolean | void> | boolean | void;
}

export default function ReplyMode({
  creating = false,
  onSubmit,
}: ReplyModeProps) {
  const [replyContext, setReplyContext] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await onSubmit?.(replyContext);

    if (result !== false) {
      setReplyContext("");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="reply-context"
          className="text-xs uppercase tracking-wide text-atlas-text-secondary"
        >
          Reply context
        </label>
        <textarea
          id="reply-context"
          value={replyContext}
          onChange={(event) => setReplyContext(event.target.value)}
          placeholder="Paste the tweet or quote Atlas should respond to."
          rows={4}
          className="mt-3 w-full rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
        />
      </div>

      <GradientButton disabled={creating} type="submit">
        {creating ? "Generating..." : "Generate reply"}
      </GradientButton>
    </form>
  );
}
