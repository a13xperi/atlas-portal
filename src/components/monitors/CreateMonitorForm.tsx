"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";

interface CreateMonitorFormProps {
  onSubmit: (name: string, keywords: string[]) => Promise<void>;
}

export default function CreateMonitorForm({ onSubmit }: CreateMonitorFormProps) {
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw) && keywords.length < 20) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || keywords.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim(), keywords);
      setName("");
      setKeywords([]);
    } catch (err: any) {
      setError(err.message || "Failed to create monitor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-glass-border bg-glass p-4 backdrop-blur-xl">
      <h3 className="mb-3 text-sm font-semibold text-atlas-text">New Monitor</h3>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Monitor name (e.g., AI Regulation)"
        className="mb-3 w-full rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
      />

      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add keyword…"
          className="flex-1 rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
        />
        <button
          type="button"
          onClick={addKeyword}
          disabled={!keywordInput.trim()}
          className="rounded-lg border border-glass-border bg-atlas-surface p-2 text-atlas-text-secondary transition-colors hover:text-atlas-teal disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {keywords.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-full bg-atlas-teal/10 px-2.5 py-1 text-xs text-atlas-teal"
            >
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-atlas-error">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-atlas-error">{error}</p>}

      <GradientButton
        onClick={handleSubmit}
        disabled={!name.trim() || keywords.length === 0 || submitting}
        fullWidth
      >
        {submitting ? "Creating…" : "Create Monitor"}
      </GradientButton>
    </div>
  );
}
