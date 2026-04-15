"use client";

import { useId, useRef, useState, type DragEventHandler } from "react";
import { Mic, MicOff, Loader2, FileText, MessageSquare, TrendingUp, ArrowUp } from "lucide-react";
import type { RecordingState } from "@/lib/useVoiceRecorder";

export interface ContentInputProps {
  placeholder?: string;
  value?: string;
  disabled?: boolean;
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
  recordingState?: RecordingState;
  recordingDuration?: number;
  onMicClick?: () => void;
  recordingError?: string | null;
}

export default function ContentInput({
  placeholder = "Paste a tweet idea or link…",
  value,
  disabled = false,
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
  recordingState = "idle",
  recordingDuration = 0,
  onMicClick,
  recordingError,
}: ContentInputProps) {
  const contentInputId = useId();
  const contentErrorId = useId();
  const sourceErrorId = useId();
  const contentHintId = useId();
  const dropZoneHintId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [internalText, setInternalText] = useState("");
  const text = value ?? internalText;
  const contentDescriptionIds = [
    contentHintId,
    contentError ? contentErrorId : null,
  ]
    .filter(Boolean)
    .join(" ");

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
        aria-describedby={sourceError ? sourceErrorId : undefined}
        aria-invalid={Boolean(sourceError)}
        type="file"
        accept={acceptFileTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        role="region"
        aria-label="File upload"
        aria-describedby={dropZoneHintId}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="rounded-2xl border border-dashed border-glass-border bg-atlas-bg/30 p-6 text-center transition-colors hover:border-atlas-teal/50 sm:p-8"
      >
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-glass-border/50 bg-atlas-surface/50 px-4 py-4 text-atlas-text-muted transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            <FileText className="w-8 h-8" aria-hidden="true" />
            <span className="text-xs">Drop a report</span>
          </button>
          <button
            type="button"
            onClick={() => textInputRef.current?.focus()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-glass-border/50 bg-atlas-surface/50 px-4 py-4 text-atlas-text-muted transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            <MessageSquare className="w-8 h-8" aria-hidden="true" />
            <span className="text-xs">Paste a tweet idea</span>
          </button>
          <button
            type="button"
            onClick={() => onTrendingClick?.()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-glass-border/50 bg-atlas-surface/50 px-4 py-4 text-atlas-text-muted transition-colors hover:border-atlas-teal hover:text-atlas-teal"
          >
            <TrendingUp className="w-8 h-8" aria-hidden="true" />
            <span className="text-xs">Pick a trending alert</span>
          </button>
        </div>
        <p id={dropZoneHintId} className="text-atlas-text-muted text-xs">
          Drag and drop files or click an option above
        </p>
      </div>

      {sourceError ? (
        <p id={sourceErrorId} role="alert" className="text-sm text-atlas-error">
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
          <label htmlFor={contentInputId} className="sr-only">
            Tweet idea or source text
          </label>
          <textarea
            id={contentInputId}
            name="content"
            ref={textInputRef}
            aria-describedby={contentDescriptionIds || undefined}
            aria-invalid={Boolean(contentError)}
            aria-errormessage={contentError ? contentErrorId : undefined}
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
          {text.trim() ? (
            <button
              type="button"
              aria-label="Generate draft"
              onClick={handleSubmit}
              disabled={disabled}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-atlas-teal/50 bg-atlas-teal/10 p-3 text-atlas-teal transition-colors hover:bg-atlas-teal/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-stretch"
            >
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : null}
          {showMic ? (
            <button
              type="button"
              aria-label={recordingState === "recording" ? "Stop recording" : recordingState === "transcribing" ? "Transcribing…" : "Record voice note"}
              onClick={onMicClick}
              disabled={recordingState === "transcribing"}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border p-3 transition-colors sm:w-auto sm:self-stretch ${
                recordingState === "recording"
                  ? "border-atlas-error bg-atlas-error/10 text-atlas-error animate-pulse"
                  : recordingState === "transcribing"
                    ? "border-atlas-teal/50 bg-atlas-teal/10 text-atlas-teal"
                    : "border-glass-border bg-atlas-surface text-atlas-text-secondary hover:text-atlas-teal"
              } disabled:cursor-not-allowed`}
            >
              {recordingState === "recording" ? (
                <>
                  <MicOff className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-mono">{Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, "0")}</span>
                </>
              ) : recordingState === "transcribing" ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Mic className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
        <div role="status" aria-live="assertive" className="sr-only">
          {contentDropActive ? "Drop file here" : ""}
        </div>
        {contentDropActive ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-atlas-teal bg-atlas-surface/95 backdrop-blur-sm">
            <span className="text-sm font-medium text-atlas-teal">
              Drop file here
            </span>
          </div>
        ) : null}
      </div>

      <p id={contentHintId} className="text-[11px] text-atlas-text-muted">
        Press{" "}
        <kbd className="rounded border border-glass-border px-1 py-0.5 text-[10px] font-mono">
          Enter
        </kbd>{" "}
        to generate. Use Shift + Enter for a new line.
      </p>

      {contentError ? (
        <p id={contentErrorId} role="alert" className="text-sm text-atlas-error">
          {contentError}
        </p>
      ) : null}

      {recordingError ? (
        <p role="alert" className="text-sm text-atlas-error">
          {recordingError}
        </p>
      ) : null}
    </div>
  );
}
