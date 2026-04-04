"use client";

import { useEffect, useRef, useState } from "react";
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

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 12;

export default function TourSpotlight({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourSpotlightProps) {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isLastStep = stepIndex === totalSteps - 1;

  // Find and track the target element
  useEffect(() => {
    const findTarget = () => {
      const el = document.querySelector(step.targetSelector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top + window.scrollY - PADDING,
        left: r.left + window.scrollX - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
      // Scroll target into view
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // Retry finding the element (it might not be mounted yet after navigation)
    findTarget();
    const retryInterval = setInterval(findTarget, 300);
    const stop = setTimeout(() => clearInterval(retryInterval), 5000);

    window.addEventListener("resize", findTarget);
    window.addEventListener("scroll", findTarget, true);

    return () => {
      clearInterval(retryInterval);
      clearTimeout(stop);
      window.removeEventListener("resize", findTarget);
      window.removeEventListener("scroll", findTarget, true);
    };
  }, [step.targetSelector]);

  // Compute bubble position relative to the target
  const getBubbleStyle = (): React.CSSProperties => {
    if (!rect) return { opacity: 0 };

    const pos = step.position;
    const gap = 16;

    if (pos === "bottom") {
      return {
        position: "absolute",
        top: rect.top + rect.height + gap,
        left: rect.left,
        maxWidth: Math.min(420, rect.width),
      };
    }
    if (pos === "top") {
      return {
        position: "absolute",
        bottom: window.innerHeight - rect.top + gap + window.scrollY,
        left: rect.left,
        maxWidth: 420,
      };
    }
    if (pos === "left") {
      return {
        position: "absolute",
        top: rect.top,
        right: window.innerWidth - rect.left + gap,
        maxWidth: 360,
      };
    }
    // right
    return {
      position: "absolute",
      top: rect.top,
      left: rect.left + rect.width + gap,
      maxWidth: 360,
    };
  };

  // SVG mask: full screen with a cutout for the target
  const maskId = "tour-spotlight-mask";

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: "none" }}>
      {/* Dark overlay with cutout */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => {
          // Clicking the overlay (not the cutout) does nothing — prevents accidental clicks
          e.stopPropagation();
        }}
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
          fill="rgba(0,0,0,0.65)"
          mask={`url(#${maskId})`}
          style={{ backdropFilter: "blur(2px)" }}
        />
      </svg>

      {/* Cutout border glow */}
      {rect ? (
        <div
          className="absolute rounded-xl border-2 border-atlas-teal/50 shadow-[0_0_20px_rgba(56,224,187,0.15)] transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* Target area is interactive */}
      {rect ? (
        <div
          className="absolute"
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
        ref={bubbleRef}
        className="transition-all duration-300"
        style={{ ...getBubbleStyle(), pointerEvents: "auto" }}
      >
        <div className="rounded-2xl border border-glass-border bg-atlas-nav/95 p-4 shadow-2xl backdrop-blur-xl">
          {/* Oracle avatar + message */}
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

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            {/* Step indicator */}
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
                {isLastStep ? (
                  "Done"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close button (top-right) */}
      <button
        type="button"
        onClick={onSkip}
        className="fixed right-4 top-4"
        style={{ pointerEvents: "auto" }}
        aria-label="Close tour"
      >
        <X className="h-5 w-5 text-white/50 transition-colors hover:text-white" />
      </button>
    </div>
  );
}
