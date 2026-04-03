"use client";

import { useRef, useState, type DragEventHandler } from "react";
import { Mic, FileText, MessageSquare, TrendingUp } from "lucide-react";

export interface ContentInputProps {
  placeholder?: string;
  value?: string;
  onDrop?: (files: FileList) => void;
  onTextChange?: (text: string) => void;
  onTextSubmit?: (
    text: string
  ) => boolean | void | Promise<boolean | void>;
  onTrendingClick?: () => void;
  showMic?: boolean;
  acceptFileTypes?: string;
  sourceError?: string;
  contentError?: string;
  contentDropActive?: boolean;
  onContentDragOver?: DragEventHandler<HTMLDivElement>;
  onContentDragLeave?: DragEventHandler<HTMLDivElement>;
  onContentDrop?: DragEventHandler<HTMLDivElement>;
}

export default function ContentInput({
  placeholder = "Paste a tweet idea or link…",
  value,
  onDrop,
  onTextChange,
  onTextSubmit,
  onTrendingClick,
  showMic = true,
  acceptFileTypes = ".pdf,.doc,.docx,.txt,.md",
  sourceError,
  contentError,
  contentDropActive = false,
  onContentDragOver,
  onContentDragLeave,
  onContentDrop,
}: ContentInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [internalText, setInternalText] = useState("");
  const text = value ?? internalText;

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (onDrop && event.dataTransfer.files.length > 0) {
      onDrop(event.dataTransfer.files);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onDrop && event.target.files && event.target.files.length > 0) {
      onDrop(event.target.files);
      event.target.value = "";
    }
  };

  const updateText = (nextText: string) => {
    if (value === undefined) {
      setInternalText(nextText);
    }
    onTextChange?.(nextText);
  };

  const clearText = () => {
    updateText("");
  };

  const handleSubmit = () => {
    try {
      const submission = onTextSubmit?.(text);

      if (submission && typeof submission === "object" && "then" in submission) {
        void submission
          .then((result) => {
            if (result !== false) {
              clearText();
            }
          })
          .catch(() => {
            // Keep the draft intact when submission fails.
          });
        return;
      }

      if (submission !== false) {
        clearText();
      }
    } catch {
      // Keep the draft intact when submission fails.
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        aria-label="Upload report file"
        type="file"
        accept={acceptFileTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="rounded-2xl border-2 border-dashed border-atlas-text-secondary/30 bg-atlas-surface p-6 text-center transition-colors hover:border-atlas-teal/50 sm:p-8"
      >
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a report file"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-glass-border bg-atlas-nav px-4 py-4 text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            <FileText className="w-8 h-8" aria-hidden="true" />
            <span className="text-xs">Drop a report</span>
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-label="Paste a tweet idea"
            onClick={() => textInputRef.current?.focus()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") textInputRef.current?.focus(); }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-glass-border bg-atlas-nav px-4 py-4 text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            <MessageSquare className="w-8 h-8" aria-hidden="true" />
            <span className="text-xs">Paste a tweet idea</span>
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-label="Pick a trending alert"
            onClick={() => onTrendingClick?.()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onTrendingClick?.(); }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-glass-border bg-atlas-nav px-4 py-4 text-atlas-text-secondary transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            <TrendingUp className="w-8 h-8" aria-hidden="true" />
            <span className="text-xs">Pick a trending alert</span>
          </div>
        </div>
        <p className="text-atlas-text-muted text-xs">
          Drag and drop files or click an option above
        </p>
      </div>

      {sourceError ? (
        <p role="alert" className="text-sm text-atlas-error">
          {sourceError}
        </p>
      ) : null}

      <div
        onDragOver={onContentDragOver}
        onDragLeave={onContentDragLeave}
        onDrop={onContentDrop}
        className="relative"
      >
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
          <textarea
            ref={textInputRef}
            aria-label="Content input"
            placeholder={placeholder}
            value={text}
            rows={3}
            onChange={(event) => {
              updateText(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            className="w-full flex-1 rounded-lg border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
          />
          {showMic ? (
            <button
              type="button"
              aria-label="Record voice note"
              className="flex w-full items-center justify-center rounded-lg border border-glass-border bg-atlas-surface p-3 text-atlas-text-secondary transition-colors hover:text-atlas-teal sm:w-auto sm:self-stretch"
            >
              <Mic className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {contentDropActive ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-atlas-teal bg-atlas-surface/95 backdrop-blur-sm">
            <span className="text-sm font-medium text-atlas-teal">
              Drop file here
            </span>
          </div>
        ) : null}
      </div>

      <p className="text-[11px] text-atlas-text-muted">
        Press{" "}
        <kbd className="rounded border border-glass-border px-1 py-0.5 text-[10px] font-mono">
          Enter
        </kbd>{" "}
        to generate. Use Shift + Enter for a new line.
      </p>

      {contentError ? (
        <p role="alert" className="text-sm text-atlas-error">
          {contentError}
        </p>
      ) : null}
    </div>
  );
}
