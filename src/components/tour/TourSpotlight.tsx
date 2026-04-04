"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { TourStep } from "@/lib/tour";

interface TourSpotlightProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
}

interface ViewportRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 12;

export default function TourSpotlight({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourSpotlightProps) {
  const [rect, setRect] = useState<ViewportRect | null>(null);
  const isLastStep = stepIndex === totalSteps - 1;

  // Track target element position (viewport-relative for fixed overlay)
  useEffect(() => {
    let raf: number;
    const track = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({
          top: r.top - PAD,
          left: r.left - PAD,
          width: r.width + PAD * 2,
          height: r.height + PAD * 2,
        });
      }
      raf = requestAnimationFrame(track);
    };

    // Scroll target into view first, then start tracking
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Small delay for scroll to settle
    const t = setTimeout(() => { track(); }, 400);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [step.targetSelector]);

  // Position the Oracle bubble near the cutout
  const getBubbleStyle = (): React.CSSProperties => {
    if (!rect) return { opacity: 0, position: "fixed" as const };

    const gap = 16;
    const bubbleW = 400;
    const bubbleH = 180; // approximate
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Try below first
    if (rect.top + rect.height + gap + bubbleH < vh) {
      return {
        position: "fixed",
        top: rect.top + rect.height + gap,
        left: Math.max(16, Math.min(rect.left, vw - bubbleW - 16)),
        maxWidth: bubbleW,
      };
    }
    // Try above
    if (rect.top - gap - bubbleH > 0) {
      return {
        position: "fixed",
        top: rect.top - gap - bubbleH,
        left: Math.max(16, Math.min(rect.left, vw - bubbleW - 16)),
        maxWidth: bubbleW,
      };
    }
    // Fallback: center horizontally below
    return {
      position: "fixed",
      top: Math.min(rect.top + rect.height + gap, vh - bubbleH - 16),
      left: Math.max(16, (vw - bubbleW) / 2),
      maxWidth: bubbleW,
    };
  };

  const maskId = `tour-mask-${stepIndex}`;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Dark overlay with cutout — uses CSS clip-path for reliable positioning */}
      <svg
        className="fixed inset-0 h-screen w-screen"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {rect ? (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx={12}
                fill="black"
              />
            ) : null}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Teal glow border around target */}
      {rect ? (
        <div
          className="fixed rounded-xl border-2 border-atlas-teal/50 shadow-[0_0_24px_rgba(56,224,187,0.2)] transition-all duration-300 ease-out"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* Make the target area clickable through the overlay */}
      {rect ? (
        <div
          className="fixed"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            pointerEvents: "auto",
          }}
        />
      ) : null}

      {/* Oracle message bubble */}
      <div
        className="transition-all duration-300 ease-out"
        style={{ ...getBubbleStyle(), pointerEvents: "auto", zIndex: 201 }}
      >
        <div className="rounded-2xl border border-glass-border bg-atlas-nav/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-atlas-teal/20 text-sm">
              🔮
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-atlas-teal">
                The Oracle
              </p>
              <p className="text-sm leading-relaxed text-atlas-text">
                {step.oracleMessage}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex
                      ? "w-4 bg-atlas-teal"
                      : i < stepIndex
                        ? "w-1.5 bg-atlas-teal/40"
                        : "w-1.5 bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="px-2 py-1 text-[11px] text-atlas-text-muted transition-colors hover:text-atlas-text"
              >
                Skip tour
              </button>

              {onPrev ? (
                <button
                  type="button"
                  onClick={onPrev}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-glass-border text-atlas-text-muted transition-colors hover:text-atlas-text"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-1 rounded-lg bg-atlas-teal/20 px-3 py-1.5 text-xs font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/30"
              >
                {isLastStep ? "Done" : <>Next <ChevronRight className="h-3 w-3" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close X */}
      <button
        type="button"
        onClick={onSkip}
        className="fixed right-4 top-4"
        style={{ pointerEvents: "auto", zIndex: 201 }}
        aria-label="Close tour"
      >
        <X className="h-5 w-5 text-white/50 transition-colors hover:text-white" />
      </button>
    </div>
  );
}
