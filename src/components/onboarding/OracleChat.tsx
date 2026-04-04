"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { AtSign, Loader2, Send, ThumbsDown, ThumbsUp } from "lucide-react";

import {
  createInitialState,
  oracleReducer,
  type ChatMessage,
  type OracleTrack,
} from "@/lib/oracle";
import {
  applyVoiceDimensionDelta,
  styleToDimensions,
  TRACK_A_INITIAL_DIMENSIONS,
  type VoiceDimensionField,
  type VoiceDimensions,
} from "@/lib/voice-profile-dimensions";
import {
  buildReferenceBlendVoices,
  getReferenceAccountLookup,
  persistReferenceSelections,
  REFERENCE_ACCOUNT_FALLBACK,
} from "@/lib/reference-accounts";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

import OracleMessage from "./OracleMessage";
import TypingIndicator from "./TypingIndicator";
import ActionZone from "./ActionZone";
import ReferenceVoiceSelector from "./ReferenceVoiceSelector";
import BlendRatioSlider from "./BlendRatioSlider";
import TopicPicker from "./TopicPicker";
import VoiceDimensionSections from "../voice-profiles/VoiceDimensionSections";
import GradientButton from "../ui/GradientButton";

// ── Sample tweets for Track A rating ─────────────────────────────

const sampleTweets: Array<{
  text: string;
  dims: Partial<Record<VoiceDimensionField, number>>;
}> = [
  {
    text: "ETH staking yields are compressing fast. The easy alpha is gone — now it's about execution risk and DVT adoption.",
    dims: { formality: 10, brevity: 10, technicalDepth: 20, evidenceOrientation: 20, solutionOrientation: 10 },
  },
  {
    text: "Everyone's talking about L2 fees but nobody's asking why L1 gas is still this high during a bear market.",
    dims: { contrarianTone: 20, directness: 10, confidence: 10, evidenceOrientation: 10, socialPosture: -10 },
  },
  {
    text: "Hot take: most DeFi governance is theater. Token holders vote, whales decide.",
    dims: { humor: 20, formality: -10, brevity: 10, warmth: 10, selfPromotionalIntensity: 10 },
  },
  {
    text: "The merge was 18 months ago and we're still arguing about MEV. Builders are the new miners.",
    dims: { contrarianTone: 10, directness: 10, technicalDepth: 10, confidence: 10, solutionOrientation: 10, socialPosture: 20, selfPromotionalIntensity: -10 },
  },
];

const styleOptions = [
  { label: "Fun", description: "Playful, witty, meme-friendly" },
  { label: "Serious", description: "Professional, data-driven" },
  { label: "Custom mix", description: "Blend it your way (recommended)" },
];

const referenceAccountLookup = getReferenceAccountLookup(REFERENCE_ACCOUNT_FALLBACK);

// ── Props ────────────────────────────────────────────────────────

interface OracleChatProps {
  initialTrack?: OracleTrack;
}

// ── Component ──────────────────────────────────────��─────────────

export default function OracleChat({ initialTrack }: OracleChatProps) {
  const router = useRouter();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(oracleReducer, undefined, createInitialState);
  const [saving, setSaving] = useState(false);
  const [xHandle, setXHandle] = useState("");
  const [calibrating, setCalibrating] = useState(false);
  const [ratings, setRatings] = useState<Record<number, "up" | "down" | null>>({});
  const [tweetLinks, setTweetLinks] = useState("");
  const [dimensions, setDimensions] = useState<VoiceDimensions>(TRACK_A_INITIAL_DIMENSIONS);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages.length, state.isTyping]);

  // If initialTrack is provided, auto-select it
  useEffect(() => {
    if (initialTrack && state.step === "fork") {
      handleAction(`fork:${initialTrack}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrack]);

  // Set user defaults
  useEffect(() => {
    if (user?.handle) {
      setXHandle((h) => h || user.handle!.replace(/^@/, ""));
    }
    if (user?.displayName || user?.handle) {
      dispatch({ type: "SET_DISPLAY_NAME", name: user.displayName || user.handle || "" });
    }
  }, [user?.displayName, user?.handle]);

  // ── Action handler with typing delay ───────────────────────────

  const handleAction = useCallback(
    (action: string) => {
      // Show typing for 400-800ms before Oracle responds
      dispatch({ type: "SET_TYPING", isTyping: true });
      const delay = 400 + Math.random() * 400;
      setTimeout(() => {
        dispatch({ type: "TRANSITION", action });
      }, delay);
    },
    [],
  );

  // ── API wrappers ───────────────────────────────────────────────

  const handleCalibrate = async () => {
    const handle = xHandle.trim().replace(/^@/, "");
    if (!handle) return;

    dispatch({ type: "SET_HANDLE", handle });
    handleAction(`handle:${handle}`);

    setCalibrating(true);
    try {
      const { profile, calibration } = await api.voice.calibrate(handle);
      const calibrated: VoiceDimensions = {
        humor: profile.humor,
        formality: profile.formality,
        brevity: profile.brevity,
        contrarianTone: profile.contrarianTone,
        directness: profile.directness ?? 50,
        warmth: profile.warmth ?? 50,
        technicalDepth: profile.technicalDepth ?? 50,
        confidence: profile.confidence ?? 50,
        evidenceOrientation: profile.evidenceOrientation ?? 50,
        solutionOrientation: profile.solutionOrientation ?? 50,
        socialPosture: profile.socialPosture ?? 50,
        selfPromotionalIntensity: profile.selfPromotionalIntensity ?? 50,
      };
      setDimensions(calibrated);
      dispatch({ type: "SET_DIMENSIONS", dimensions: calibrated });
      dispatch({
        type: "SET_CALIBRATION",
        result: { analysis: calibration.analysis, tweetsAnalyzed: calibration.tweetsAnalyzed },
      });

      // Trigger scan-complete transition after a brief pause
      setTimeout(() => handleAction("scan-complete"), 600);
    } catch (err) {
      console.error("Calibration failed:", err);
      // Still advance with defaults
      dispatch({ type: "SET_DIMENSIONS", dimensions });
      dispatch({
        type: "SET_CALIBRATION",
        result: { analysis: "Couldn't scan tweets — using default dimensions. Adjust below.", tweetsAnalyzed: 0 },
      });
      setTimeout(() => handleAction("scan-complete"), 600);
    } finally {
      setCalibrating(false);
    }
  };

  const handleSaveAndContinueReview = async () => {
    setSaving(true);
    try {
      if (state.displayName.trim().length >= 2) {
        await api.users.updateProfile({ displayName: state.displayName.trim() });
      }
      await api.voice.updateProfile(dimensions);
      dispatch({ type: "SET_DIMENSIONS", dimensions });
    } catch (e) {
      console.error("Failed to save voice:", e);
    } finally {
      setSaving(false);
    }
    handleAction("review-continue");
  };

  const handleDimsContinue = async () => {
    setSaving(true);
    try {
      if (state.displayName.trim().length >= 2) {
        await api.users.updateProfile({ displayName: state.displayName.trim() });
      }
      await api.voice.updateProfile(dimensions);
      dispatch({ type: "SET_DIMENSIONS", dimensions });
    } catch (e) {
      console.error("Failed to save voice:", e);
    } finally {
      setSaving(false);
    }
    handleAction("dims-continue");
  };

  const handleRefsContinue = async () => {
    if (state.selectedRefIds.length < 2 || saving) return;
    setSaving(true);
    try {
      await persistReferenceSelections({
        userId: user?.id,
        ids: state.selectedRefIds,
        saveRemote: api.referenceAccounts.saveSelections,
      });
      for (const refId of state.selectedRefIds) {
        const account = referenceAccountLookup.get(refId);
        try {
          await api.voice.addReference(
            account?.displayName || account?.name || refId,
            account?.handle || refId,
          );
        } catch { /* optional */ }
      }
    } catch (e) {
      console.error("Failed to save refs:", e);
    } finally {
      setSaving(false);
    }
    handleAction("refs-continue");
  };

  const handleBlendContinue = async () => {
    setSaving(true);
    try {
      await api.voice.createBlend(
        "Onboarding blend",
        buildReferenceBlendVoices(state.selectedRefIds, state.selfPercentage, REFERENCE_ACCOUNT_FALLBACK),
      );
    } catch { /* optional */ } finally {
      setSaving(false);
    }
    handleAction("blend-continue");
  };

  const handleTopicsContinue = async () => {
    if (state.selectedTopics.length < 1) return;
    setSaving(true);
    try {
      await api.briefing.updatePreferences({
        deliveryTime: "08:00",
        topics: state.selectedTopics,
        sources: [],
        channel: "Portal Only",
      });
    } catch { /* optional */ } finally {
      setSaving(false);
    }
    handleAction("topics-continue");
  };

  const handleHandoff = (value: string) => {
    if (value === "handoff:telegram") {
      router.push("/onboarding/handoff");
    } else {
      router.push("/dashboard");
    }
  };

  // ── Inline component renderer ──────────────────────────────────

  const renderInlineComponent = (message: ChatMessage) => {
    if (!message.component) return null;

    switch (message.component) {
      case "handle-input":
        return (
          <div className="rounded-2xl border border-glass-border bg-atlas-surface/60 p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-atlas-text-secondary">
                  <AtSign className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value.replace(/^@/, ""))}
                  placeholder="atlasanalyst"
                  className="w-full rounded-lg border border-glass-border bg-atlas-surface px-4 py-3 pl-10 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleCalibrate()}
                />
              </div>
              <button
                type="button"
                onClick={handleCalibrate}
                disabled={!xHandle.trim() || calibrating}
                className="rounded-lg border border-atlas-teal/30 bg-atlas-teal/10 px-4 py-3 text-sm font-medium text-atlas-teal transition-colors hover:border-atlas-teal disabled:opacity-50"
              >
                {calibrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        );

      case "scan-progress":
        return (
          <div className="rounded-2xl border border-atlas-teal/20 bg-atlas-teal/5 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-atlas-teal" />
              <div className="space-y-1">
                <p className="text-sm text-atlas-teal font-medium">Scanning tweets...</p>
                <p className="text-xs text-atlas-text-muted">Finding patterns in writing style</p>
              </div>
            </div>
          </div>
        );

      case "dimensions":
        return (
          <div className="rounded-2xl border border-glass-border bg-atlas-surface/40 p-4 space-y-4">
            <VoiceDimensionSections
              values={dimensions}
              interactive
              onChange={(field, value) => {
                setDimensions((d) => ({ ...d, [field]: value }));
              }}
            />
          </div>
        );

      case "rate-tweets":
        return (
          <div className="space-y-3">
            {sampleTweets.map((tweet, index) => (
              <div
                key={tweet.text}
                className="flex items-start justify-between gap-4 rounded-2xl bg-atlas-surface p-4"
              >
                <p className="flex-1 text-sm text-atlas-text">{tweet.text}</p>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const multiplier = ratings[index] === "up" ? -1 : 1;
                      setDimensions((d) => applyVoiceDimensionDelta(d, tweet.dims, multiplier));
                      setRatings((r) => ({ ...r, [index]: ratings[index] === "up" ? null : "up" }));
                    }}
                    className={`transition-colors ${ratings[index] === "up" ? "text-atlas-teal" : "text-atlas-text-secondary hover:text-atlas-teal"}`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const multiplier = ratings[index] === "down" ? 1 : -1;
                      setDimensions((d) => applyVoiceDimensionDelta(d, tweet.dims, multiplier));
                      setRatings((r) => ({ ...r, [index]: ratings[index] === "down" ? null : "down" }));
                    }}
                    className={`transition-colors ${ratings[index] === "down" ? "text-atlas-error" : "text-atlas-text-secondary hover:text-atlas-error"}`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <GradientButton fullWidth onClick={handleSaveAndContinueReview} disabled={saving}>
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </span>
              ) : "Looks good, continue"}
            </GradientButton>
          </div>
        );

      case "style-picker":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {styleOptions.map(({ label, description }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    dispatch({ type: "SET_STYLE", style: label });
                    setDimensions(styleToDimensions(label));
                    handleAction(`style:${label}`);
                  }}
                  className="rounded-2xl bg-atlas-surface p-4 text-center transition-all border border-glass-border text-atlas-text-secondary hover:border-atlas-teal hover:text-atlas-text"
                >
                  <span className="text-sm font-medium">{label}</span>
                  <p className="mt-1 text-xs text-atlas-text-muted">{description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case "tweet-paste":
        return (
          <div className="space-y-3">
            <textarea
              value={tweetLinks}
              onChange={(e) => setTweetLinks(e.target.value)}
              placeholder="Paste tweet URLs — one per line"
              rows={3}
              className="w-full resize-none rounded-2xl border border-dashed border-atlas-text-secondary/30 bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
            />
            {tweetLinks.trim() && (
              <GradientButton fullWidth onClick={() => handleAction("paste-continue")}>
                Continue with these signals
              </GradientButton>
            )}
          </div>
        );

      case "references":
        return (
          <div className="space-y-3">
            <ReferenceVoiceSelector
              accounts={REFERENCE_ACCOUNT_FALLBACK}
              selected={state.selectedRefIds}
              onSelectionChange={(ids) => dispatch({ type: "SET_REFS", ids })}
              onContinue={handleRefsContinue}
            />
          </div>
        );

      case "blend": {
        const referenceNames = state.selectedRefIds.map((id) => {
          const account = referenceAccountLookup.get(id);
          return account?.displayName || account?.name || id;
        });
        return (
          <div className="space-y-4">
            <BlendRatioSlider
              selfPercentage={state.selfPercentage}
              onChange={(v) => dispatch({ type: "SET_BLEND", selfPercentage: v })}
              referenceNames={referenceNames}
            />
            <GradientButton fullWidth onClick={handleBlendContinue} disabled={saving}>
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving blend...
                </span>
              ) : "Continue"}
            </GradientButton>
          </div>
        );
      }

      case "topics":
        return (
          <div className="space-y-4">
            <TopicPicker
              selected={state.selectedTopics}
              onChange={(topics) => dispatch({ type: "SET_TOPICS", topics })}
            />
            <GradientButton
              fullWidth
              onClick={handleTopicsContinue}
              disabled={saving || state.selectedTopics.length < 1}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </span>
              ) : "Continue"}
            </GradientButton>
          </div>
        );

      case "handoff-actions":
        return null; // Handled by ActionZone via message.actions

      default:
        return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────

  // Find the last message's actions (for bottom ActionZone)
  const lastMessage = state.messages[state.messages.length - 1];
  const pendingActions = lastMessage?.actions ?? [];
  // Only show standalone ActionZone for actions that aren't tied to inline components
  const showBottomActions =
    pendingActions.length > 0 &&
    !lastMessage.component &&
    !state.isTyping;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-4">
        <AnimatePresence mode="popLayout">
          {state.messages.map((message) => (
            <OracleMessage key={message.id} role={message.role} content={message.content}>
              {renderInlineComponent(message)}
              {/* Inline action buttons for messages with actions + no inline component */}
              {message.actions && message.actions.length > 0 && !message.component && message.id === lastMessage?.id && (
                <ActionZone
                  actions={message.actions}
                  onAction={(v) => {
                    if (v.startsWith("handoff:")) {
                      handleHandoff(v);
                    } else {
                      handleAction(v);
                    }
                  }}
                  disabled={state.isTyping}
                />
              )}
              {/* Handoff actions rendered alongside the handoff-actions component */}
              {message.component === "handoff-actions" && message.actions && (
                <ActionZone
                  actions={message.actions}
                  onAction={handleHandoff}
                  disabled={false}
                />
              )}
            </OracleMessage>
          ))}
        </AnimatePresence>

        {state.isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom action zone for Track B dims continue */}
      {state.step === "b:dims" && (
        <div className="border-t border-glass-border bg-atlas-surface/30 px-4 py-3">
          <GradientButton fullWidth onClick={handleDimsContinue} disabled={saving}>
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : "Continue to reference voices"}
          </GradientButton>
        </div>
      )}
    </div>
  );
}
