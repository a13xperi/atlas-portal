"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VoiceCaptureProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceCapture({
  onTranscript,
  disabled = false,
}: VoiceCaptureProps) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      setSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setListening(false);
        setInterim("");
      }
    };

    recognition.start();
    setListening(true);
  }, [listening, onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-label={listening ? "Stop recording" : "Voice capture"}
        className={`group relative flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
          listening
            ? "border-atlas-error/60 bg-atlas-error/15 text-atlas-error"
            : "border-glass-border bg-glass text-atlas-text-secondary hover:border-atlas-teal/50 hover:text-atlas-teal"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {listening && (
          <span className="absolute inset-0 animate-ping rounded-full bg-atlas-error/20" />
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {listening ? (
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
          ) : (
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 10v2a7 7 0 01-14 0v-2"
              />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          )}
        </svg>
      </button>
      {listening && (
        <p className="text-xs text-atlas-text-secondary animate-pulse">
          {interim || "Listening..."}
        </p>
      )}
    </div>
  );
}
