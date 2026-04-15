"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";

interface VoicePreviewPlayerProps {
  text: string;
}

type PlayerState = "idle" | "playing" | "paused";

export default function VoicePreviewPlayer({ text }: VoicePreviewPlayerProps) {
  const [state, setState] = useState<PlayerState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const handleVoicesChanged = () => {
      // Force re-render when voices become available so the
      // component can update its enabled state if needed.
      setIsSupported(window.speechSynthesis.getVoices().length > 0);
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop playback when the text prop changes.
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setState("idle");
    }
  }, [text]);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;

    if (state === "playing") {
      synth.pause();
      setState("paused");
      return;
    }

    if (state === "paused" && synth.paused) {
      synth.resume();
      setState("playing");
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utteranceRef.current = utterance;

    utterance.onstart = () => setState("playing");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");

    // Prefer an English voice if available.
    const voices = synth.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
    if (enVoice) {
      utterance.voice = enVoice;
    }

    synth.speak(utterance);
  }, [state, text]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setState("idle");
    }
  }, []);

  if (!isSupported) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-atlas-surface/40 px-2 py-1 text-[11px] text-atlas-text-muted"
        title="Voice preview is not supported in this browser"
      >
        <Volume2 className="h-3 w-3" />
        <span>Listen</span>
      </div>
    );
  }

  const isPlaying = state === "playing";

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-glass-border bg-atlas-surface/40 p-0.5">
      <button
        type="button"
        onClick={speak}
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
        className="inline-flex items-center justify-center rounded-md p-1 text-atlas-text-secondary transition-colors hover:bg-atlas-teal/10 hover:text-atlas-teal"
      >
        {isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </button>

      {state !== "idle" && (
        <button
          type="button"
          onClick={stop}
          aria-label="Stop preview"
          className="inline-flex items-center justify-center rounded-md p-1 text-atlas-text-secondary transition-colors hover:bg-atlas-error/10 hover:text-atlas-error"
        >
          <Square className="h-3 w-3" />
        </button>
      )}

      <span className="px-1.5 text-[10px] text-atlas-text-muted">
        {isPlaying ? "Playing" : state === "paused" ? "Paused" : "Listen"}
      </span>

      {isPlaying && (
        <span className="mr-1.5 flex items-center gap-0.5">
          <span className="h-2 w-0.5 animate-[bounce_1s_infinite] rounded-full bg-atlas-teal" />
          <span className="h-2 w-0.5 animate-[bounce_1s_infinite_0.2s] rounded-full bg-atlas-teal" />
          <span className="h-2 w-0.5 animate-[bounce_1s_infinite_0.4s] rounded-full bg-atlas-teal" />
        </span>
      )}
    </div>
  );
}
