"use client";

import { useRef } from "react";
import { Mic, FileText, MessageSquare, TrendingUp } from "lucide-react";

export interface ContentInputProps {
  placeholder?: string;
  onDrop?: (files: FileList) => void;
  onTextSubmit?: (text: string) => void;
  onTrendingClick?: () => void;
  showMic?: boolean;
  acceptFileTypes?: string;
}

export default function ContentInput({
  placeholder = "Paste a tweet idea or link…",
  onDrop,
  onTextSubmit,
  onTrendingClick,
  showMic = true,
  acceptFileTypes = ".pdf,.doc,.docx,.txt,.md",
}: ContentInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDrop && e.target.files && e.target.files.length > 0) {
      onDrop(e.target.files);
      e.target.value = ""; // Reset so same file can be selected again
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptFileTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-atlas-text-secondary/30 bg-atlas-surface rounded-2xl p-8 text-center hover:border-atlas-teal/50 transition-colors"
      >
        <div className="flex justify-center gap-8 mb-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-atlas-text-secondary hover:text-atlas-teal transition-colors cursor-pointer"
          >
            <FileText className="w-8 h-8" />
            <span className="text-xs">Drop a report</span>
          </div>
          <div
            onClick={() => textInputRef.current?.focus()}
            className="flex flex-col items-center gap-2 text-atlas-text-secondary hover:text-atlas-teal transition-colors cursor-pointer"
          >
            <MessageSquare className="w-8 h-8" />
            <span className="text-xs">Paste a tweet idea</span>
          </div>
          <div
            onClick={() => onTrendingClick?.()}
            className="flex flex-col items-center gap-2 text-atlas-text-secondary hover:text-atlas-teal transition-colors cursor-pointer"
          >
            <TrendingUp className="w-8 h-8" />
            <span className="text-xs">Pick a trending alert</span>
          </div>
        </div>
        <p className="text-atlas-text-muted text-xs">
          Drag and drop files or click an option above
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={textInputRef}
          type="text"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onTextSubmit?.(e.currentTarget.value);
              e.currentTarget.value = "";
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
    </div>
  );
}
