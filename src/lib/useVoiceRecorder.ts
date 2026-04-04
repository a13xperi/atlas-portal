"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "./api";

export type RecordingState = "idle" | "recording" | "transcribing";

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) {
          setState("idle");
          return;
        }

        setState("transcribing");
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
          if (!res.ok) throw new Error("Transcription failed");
          const { text } = await res.json();
          onTranscript(text);
        } catch (err: any) {
          setError(err.message || "Transcription failed");
        } finally {
          setState("idle");
        }
      };

      recorder.start(250);
      setState("recording");
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setError("Microphone access denied");
      setState("idle");
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
    setDuration(0);
  }, []);

  return { state, duration, error, startRecording, stopRecording, cancelRecording };
}
