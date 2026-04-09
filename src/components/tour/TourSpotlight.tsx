"use client";

import { useEffect, useState, useCallback } from "react";
import { Compass, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { TourStep } from "@/lib/tour";

interface TourSpotlightProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 12;
const MAX_TARGET_H = 300; // Cap cutout height so it doesn't swallow the page

export default function TourSpotlight({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourSpotlightProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const isLastStep = stepIndex === totalSteps - 1;

  const measure = useCallback(() => {
    const el = document.querySelector(step.targetSelector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Cap height so tall sections don't break the spotlight
    const h = Math.min(r.height + PAD * 2, MAX_TARGET_H);
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: h,
    });
  }, [step.targetSelector]);

  useEffect(() => {
    // Scroll into view then start tracking
    const el = document.querySelector(step.targetSelector);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    const t = setTimeout(() => measure(), 500);
    let raf: number;
    const loop = () => { measure(); raf = requestAnimationFrame(loop); };
    const start = setTimeout(loop, 600);

    return () => { clearTimeout(t); clearTimeout(start); cancelAnimationFrame(raf); };
  }, [step.targetSelector, measure]);

  const bubbleStyle = (): React.CSSProperties => {
    if (!rect) {
      return { opacity: 0, position: "fixed" };
    }

    const gap = 12;
    const bubbleWidth = Math.min(380, window.innerWidth - 24);
    const maxLeft = window.innerWidth - bubbleWidth - 12;
    const maxTop = window.innerHeight - 200;
    const centeredLeft = Math.max(
      12,
      Math.min(rect.left + rect.width / 2 - bubbleWidth / 2, maxLeft),
    );

    if (step.position === "top") {
      return {
        position: "fixed",
        top: Math.max(12, rect.top - 176 - gap),
        left: centeredLeft,
        width: bubbleWidth,
        zIndex: 201,
      };
    }

    if (step.position === "left") {
      return {
        position: "fixed",
        top: Math.max(12, Math.min(rect.top, maxTop)),
        left: Math.max(12, rect.left - bubbleWidth - gap),
        width: bubbleWidth,
        zIndex: 201,
      };
    }

    if (step.position === "right") {
      return {
        position: "fixed",
        top: Math.max(12, Math.min(rect.top, maxTop)),
        left: Math.min(maxLeft, rect.left + rect.width + gap),
        width: bubbleWidth,
        zIndex: 201,
      };
    }

    return {
      position: "fixed",
      top: Math.min(rect.top + rect.height + gap, maxTop),
      left: centeredLeft,
      width: bubbleWidth,
      zIndex: 201,
    };
  };

  const maskId = `tour-mask-${stepIndex}`;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Overlay with cutout */}
      <svg className="fixed inset-0 h-screen w-screen" style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {rect && <rect x={rect.left} y={rect.top} width={rect.width} height={rect.height} rx={12} fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask={`url(#${maskId})`} />
      </svg>

      {/* Glow border */}
      {rect && (
        <div className="fixed rounded-xl border-2 border-atlas-teal/50 shadow-[0_0_20px_rgba(56,224,187,0.2)] transition-all duration-300"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, pointerEvents: "none" }} />
      )}

      {/* Interactive target area */}
      {rect && (
        <div className="fixed" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, pointerEvents: "auto" }} />
      )}

      {/* Oracle bubble */}
      <div className="transition-all duration-300" style={{ ...bubbleStyle(), pointerEvents: "auto" }}>
        <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-4 shadow-2xl">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-atlas-teal/15 text-atlas-teal">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-atlas-teal">The Oracle</p>
              <p className="text-sm leading-relaxed text-atlas-text">{step.oracleMessage}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-4 bg-atlas-teal" : i < stepIndex ? "w-1.5 bg-atlas-teal/40" : "w-1.5 bg-white/10"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onSkip} className="px-2 py-1 text-[11px] text-atlas-text-muted hover:text-atlas-text">Skip tour</button>
              {onPrev && (
                <button type="button" onClick={onPrev} className="flex h-7 w-7 items-center justify-center rounded-lg border border-glass-border text-atlas-text-muted hover:text-atlas-text">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="button" onClick={onNext} className="flex items-center gap-1 rounded-lg bg-atlas-teal/20 px-3 py-1.5 text-xs font-medium text-atlas-teal hover:bg-atlas-teal/30">
                {isLastStep ? "Done" : <>Next <ChevronRight className="h-3 w-3" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close X */}
      <button type="button" onClick={onSkip} className="fixed right-4 top-4" style={{ pointerEvents: "auto", zIndex: 201 }} aria-label="Close tour">
        <X className="h-5 w-5 text-atlas-text-muted transition-colors hover:text-atlas-text" />
      </button>
    </div>
  );
}
