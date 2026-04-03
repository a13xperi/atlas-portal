"use client";

import { useId, useRef, useState } from "react";
import { Mic, FileText, MessageSquare, TrendingUp } from "lucide-react";

export interface ContentInputProps {
  placeholder?: string;
  onDrop?: (files: FileList) => void;
  onTextChange?: (text: string) => void;
  onTextSubmit?: (text: string) => Promise<boolean | void> | boolean | void;
  onTrendingClick?: () => void;
  showMic?: boolean;
  acceptFileTypes?: string;
  sourceError?: string;
  contentError?: string;
}

export default function ContentInput({
  placeholder = "Paste a tweet idea or link…",
  onDrop,
  onTextChange,
  onTextSubmit,
  onTrendingClick,
  showMic = true,
  acceptFileTypes = ".pdf,.doc,.docx,.txt,.md",
  sourceError,
  contentError,
}: ContentInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const characterCountId = useId();
  const sourceErrorId = useId();
  const contentErrorId = useId();
  const [text, setText] = useState("");

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

  const handleSubmit = async () => {
    if (!onTextSubmit) return;

    const result = await onTextSubmit(text);

    if (result !== false) {
      setText("");
    }
  };

  const describedBy = [
    characterCountId,
    sourceError ? sourceErrorId : null,
    contentError ? contentErrorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptFileTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="border-2 border-dashed border-atlas-text-secondary/30 bg-atlas-surface rounded-2xl p-8 text-center hover:border-atlas-teal/50 transition-colors"
      >
        <div className="mb-4 flex justify-center gap-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-atlas-text-secondary hover:text-atlas-teal transition-colors"
          >
            <FileText className="w-8 h-8" />
            <span className="text-xs">Drop a report</span>
          </button>
          <button
            type="button"
            onClick={() => textInputRef.current?.focus()}
            className="flex flex-col items-center gap-2 text-atlas-text-secondary hover:text-atlas-teal transition-colors"
          >
            <MessageSquare className="w-8 h-8" />
            <span className="text-xs">Paste a tweet idea</span>
          </button>
          <button
            type="button"
            onClick={() => onTrendingClick?.()}
            className="flex flex-col items-center gap-2 text-atlas-text-secondary hover:text-atlas-teal transition-colors"
          >
            <TrendingUp className="w-8 h-8" />
            <span className="text-xs">Pick a trending alert</span>
          </button>
        </div>
        <p className="text-atlas-text-muted text-xs">
          Drag and drop files or click an option above
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={textInputRef}
          type="text"
          value={text}
          aria-label="Tweet idea input"
          aria-describedby={describedBy || undefined}
          placeholder={placeholder}
          onChange={(event) => {
            setText(event.currentTarget.value);
            onTextChange?.(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          className="flex-1 bg-atlas-surface rounded-lg px-4 py-3 text-atlas-text placeholder-atlas-text-secondary text-sm border border-glass-border focus:outline-none focus:border-atlas-teal"
        />
        {showMic && (
          <button
            type="button"
            className="p-3 bg-atlas-surface rounded-lg border border-glass-border text-atlas-text-secondary hover:text-atlas-teal transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <p
          id={characterCountId}
          className="text-atlas-text-muted text-xs text-right"
        >
          {text.length}/2000
        </p>
        {sourceError ? (
          <p id={sourceErrorId} className="text-sm text-atlas-error">
            {sourceError}
          </p>
        ) : null}
        {contentError ? (
          <p id={contentErrorId} className="text-sm text-atlas-error">
            {contentError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
