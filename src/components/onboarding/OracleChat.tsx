"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  canAdvance,
  getContinueLabel,
  getOnboardingCompletionHref,
  getTrackMeta,
  initialOracleState,
  oracleReducer,
} from "@/lib/oracle";
import { styleToDimensions, TRACK_A_INITIAL_DIMENSIONS } from "@/lib/voice-profile-dimensions";
import {
  getReferenceAccountLookup,
  persistReferenceSelections,
  buildReferenceBlendVoices,
  REFERENCE_ACCOUNT_FALLBACK,
} from "@/lib/reference-accounts";

import OracleAvatar from "./OracleAvatar";
import OracleMessage from "./OracleMessage";
import TrackBadge from "./TrackBadge";
import TypingIndicator from "./TypingIndicator";
import ActionZone from "./ActionZone";
import NavBar from "@/components/ui/NavBar";

// Inline components
import TopicPicker from "./TopicPicker";
import ReferenceVoiceSelector from "./ReferenceVoiceSelector";
import ContentSignalsPreview from "./ContentSignalsPreview";
import VoiceDimensionSections from "@/components/voice-profiles/VoiceDimensionSections";
import GradientButton from "@/components/ui/GradientButton";
import ContentInput from "@/components/ui/ContentInput";
import { CheckCircle, Loader2 } from "lucide-react";

const referenceAccountLookup = getReferenceAccountLookup(
  REFERENCE_ACCOUNT_FALLBACK
);

const styleOptions = [
  { label: "Fun", description: "Playful, witty, meme-friendly" },
  { label: "Serious", description: "Professional, data-driven" },
  { label: "Custom mix", description: "Blend it your way" },
];

export default function OracleChat() {
  const router = useRouter();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(oracleReducer, null, initialOracleState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const calibratingRef = useRef(false);
  const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [resumeTrackAAfterOAuth, setResumeTrackAAfterOAuth] = useState(false);
  const [blendSaveStatus, setBlendSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  // Tracks the persisted blend so future PATCH operations can target it.
  const [, setSavedBlendId] = useState<string | null>(null);

  // Pre-fill handle from linked X profile
  useEffect(() => {
    if (user?.handle && !state.xHandle) {
      dispatch({ type: "SET_HANDLE", handle: user.handle.replace(/^@/, "") });
    }
  }, [user?.handle, state.xHandle]);

  // Default blend name when entering the name step
  useEffect(() => {
    if (state.currentStep === "NAME_VOICE" && !state.blendName) {
      const defaultName = `My voice - ${new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
      dispatch({ type: "SET_BLEND_NAME", name: defaultName });
    }
  }, [state.currentStep, state.blendName]);

  // Deep-link pre-select: /onboarding/track-a|track-b stores the chosen
  // track in sessionStorage before redirecting here. Pick it up on mount
  // so the chat skips the welcome prompt and enters the right path.
  useEffect(() => {
    if (state.track !== null || state.currentStep !== "WELCOME") return;
    let preselected: string | null = null;
    try {
      preselected = sessionStorage.getItem("atlas_preselected_track");
    } catch {
      preselected = null;
    }
    if (preselected === "a" || preselected === "b") {
      try {
        sessionStorage.removeItem("atlas_preselected_track");
      } catch {
        /* ignore */
      }
      dispatch({ type: "SET_TRACK", track: preselected });
    }
  }, [state.track, state.currentStep]);

  // Detect OAuth callback return from X
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const xConnected = params.get("x_connected");
    const handle = params.get("handle");
    if (xConnected === "true") {
      if (handle) {
        dispatch({ type: "SET_HANDLE", handle: handle.replace(/^@/, "") });
      }
      dispatch({ type: "SET_X_CONNECTED", connected: true });
      setResumeTrackAAfterOAuth(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Resume straight into Track A when returning from X OAuth.
  useEffect(() => {
    if (
      !resumeTrackAAfterOAuth ||
      state.currentStep !== "WELCOME" ||
      state.track !== null ||
      !state.xConnected
    ) {
      return;
    }

    setResumeTrackAAfterOAuth(false);
    dispatch({ type: "SET_TRACK", track: "a" });
  }, [
    resumeTrackAAfterOAuth,
    state.currentStep,
    state.track,
    state.xConnected,
  ]);

  // Auto-advance if already connected to X
  useEffect(() => {
    if (
      state.currentStep !== "CONNECT_X" ||
      (state.xConnected && state.xHandle)
    ) {
      return;
    }

    api.auth.x
      .status()
      .then((res) => {
        if (!res.linked) {
          return;
        }

        if (res.xHandle) {
          dispatch({ type: "SET_HANDLE", handle: res.xHandle.replace(/^@/, "") });
        }
        dispatch({ type: "SET_X_CONNECTED", connected: true });
      })
      .catch(() => {});
  }, [state.currentStep, state.xConnected, state.xHandle]);

  // Auto-advance from CONNECT_X when connected
  useEffect(() => {
    if (state.currentStep === "CONNECT_X" && state.xConnected && state.xHandle) {
      dispatch({ type: "ADVANCE", payload: `Connected as @${state.xHandle}` });
    }
  }, [state.currentStep, state.xConnected, state.xHandle]);

  // ── Typing animation: drain pending messages with delay ──────────
  // NOTE: We deliberately do NOT depend on `state.isTyping` here. Doing so
  // creates a race where dispatching SET_TYPING(true) inside the effect
  // triggers a re-run, whose cleanup clears the pending dequeue timer
  // before it can fire — leaving the chat stuck on the typing indicator
  // forever (the original "blank /onboarding screen" bug).
  useEffect(() => {
    if (state.pendingMessages.length === 0) {
      // Nothing to drain — make sure the typing indicator clears.
      if (state.isTyping) dispatch({ type: "SET_TYPING", isTyping: false });
      return;
    }

    // A drain is already scheduled — let it complete.
    if (drainTimerRef.current) return;

    if (!state.isTyping) {
      dispatch({ type: "SET_TYPING", isTyping: true });
    }

    const msg = state.pendingMessages[0];
    const wordCount = msg.content.split(/\s+/).length;
    const delay = Math.min(1200, Math.max(300, wordCount * 40));

    drainTimerRef.current = setTimeout(() => {
      drainTimerRef.current = null;
      dispatch({ type: "DEQUEUE_MESSAGE" });
    }, delay);

    return () => {
      if (drainTimerRef.current) {
        clearTimeout(drainTimerRef.current);
        drainTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingMessages]);

  // ── Auto-scroll on new messages ──────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages.length, state.isTyping]);

  // ── API persistence side effects ─────────────────────────────────
  const persistAfterStep = useCallback(
    async (step: string) => {
      try {
        if (step === "TRACK_A_RESULT" || step === "TRACK_B_DIMENSIONS") {
          await api.voice.updateProfile(state.dimensions);
        }
        if (step === "REFERENCES") {
          await persistReferenceSelections({
            userId: user?.id,
            ids: state.selectedRefs,
            saveRemote: api.referenceAccounts.saveSelections,
          });
          for (const refId of state.selectedRefs) {
            const acct = referenceAccountLookup.get(refId);
            try {
              await api.voice.addReference(
                acct?.displayName || acct?.name || refId,
                acct?.handle || refId
              );
            } catch {
              /* optional */
            }
          }
        }
        if (step === "NAME_VOICE") {
          setBlendSaveStatus("saving");
          try {
            const result = await api.voice.createBlend(
              state.blendName.trim() || "My voice",
              buildReferenceBlendVoices(
                state.selectedRefs,
                state.selfPercentage,
                REFERENCE_ACCOUNT_FALLBACK
              )
            );
            setSavedBlendId(result.blend.id);
            setBlendSaveStatus("saved");
          } catch (err) {
            console.error("Blend persist failed:", err);
            setBlendSaveStatus("error");
          }
        }
        if (step === "TOPICS") {
          try {
            await api.briefing.updatePreferences({
              deliveryTime: "08:00",
              topics: state.selectedTopics,
              sources: [],
              channel: "Portal Only",
            });
          } catch {
            /* optional */
          }
          if (state.track === "a" || state.track === "b") {
            try {
              await api.users.updateProfile({
                onboardingTrack: state.track === "a" ? "TRACK_A" : "TRACK_B",
              });
            } catch {
              /* optional — non-fatal */
            }
          }
        }
      } catch (e) {
        console.error("Persist failed:", e);
      }
    },
    [state, user?.id]
  );

  // ── Handle action from Oracle message buttons ────────────────────
  const handleAction = useCallback(
    (value: string) => {
      if (value === "start-onboarding") {
        dispatch({ type: "ADVANCE", payload: "Let\'s go" });
        return;
      }
      if (value === "skip-x") {
        dispatch({ type: "SET_TRACK", track: "b" });
        return;
      }
      if (value === "track-a" || value === "track-b") {
        dispatch({
          type: "SET_TRACK",
          track: value === "track-a" ? "a" : "b",
        });
        return;
      }
      if (value === "go-to-dashboard") {
        router.push("/dashboard");
        return;
      }
    },
    [router]
  );

  // ── Handle "Continue" from ActionZone ────────────────────────────
  const handleContinue = useCallback(async () => {
    if (!canAdvance(state)) return;

    const step = state.currentStep;

    // Persist data from the step we're leaving
    await persistAfterStep(step);

    // Build user echo message
    let echo: string | undefined;
    if (step === "TRACK_B_STYLE") echo = state.selectedStyle || undefined;
    if (step === "REFERENCES")
      echo = `Selected ${state.selectedRefs.length} references`;
    if (step === "BLEND") echo = `${state.selfPercentage}% my voice`;
    if (step === "NAME_VOICE") echo = state.blendName;
    if (step === "TOPICS") echo = state.selectedTopics.join(", ");

    if (step === "TOPICS") {
      // Finish the wizard on the final preferences step and land users in the
      // next surface they should act in, rather than the legacy handoff screen.
      router.replace(getOnboardingCompletionHref(state.track));
      return;
    }

    dispatch({ type: "ADVANCE", payload: echo });
  }, [state, persistAfterStep, router]);

  // ── Reset calibration lock on scanning re-entry ──────────────────
  useEffect(() => {
    if (state.currentStep === "TRACK_A_SCANNING" && state.calibrationResult === null) {
      calibratingRef.current = false;
    }
  }, [state.currentStep, state.calibrationResult]);

  // ── Auto-trigger calibration for Track A scanning step ───────────
  useEffect(() => {
    if (
      state.currentStep !== "TRACK_A_SCANNING" ||
      calibratingRef.current ||
      state.calibrationResult
    )
      return;

    calibratingRef.current = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    (async () => {
      try {
        const { profile, calibration } = await api.voice.calibrate(state.xHandle, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        dispatch({
          type: "SET_CALIBRATION",
          result: {
            analysis: calibration.analysis,
            tweetsAnalyzed: calibration.tweetsAnalyzed,
          },
        });
        dispatch({
          type: "SET_DIMENSIONS",
          dimensions: {
            humor: profile.humor ?? 50,
            formality: profile.formality ?? 50,
            brevity: profile.brevity ?? 50,
            contrarianTone: profile.contrarianTone ?? 50,
            directness: profile.directness ?? 50,
            warmth: profile.warmth ?? 50,
            technicalDepth: profile.technicalDepth ?? 50,
            confidence: profile.confidence ?? 50,
            evidenceOrientation: profile.evidenceOrientation ?? 50,
            solutionOrientation: profile.solutionOrientation ?? 50,
            socialPosture: profile.socialPosture ?? 50,
            selfPromotionalIntensity: profile.selfPromotionalIntensity ?? 50,
          },
        });
        // Auto-advance after calibration, then add personalized commentary
        dispatch({
          type: "ADVANCE",
          payload: `Calibrated from ${calibration.tweetsAnalyzed} tweets`,
        });
        if (calibration.analysis) {
          dispatch({
            type: "ENQUEUE_MESSAGES",
            messages: [
              {
                id: `calibration-commentary-${Date.now()}`,
                role: "oracle",
                content: calibration.analysis,
                timestamp: Date.now(),
              },
            ],
          });
        }
        // NOTE: Supplementary LLM oracle.message() call intentionally removed.
        // Anil feedback (Apr 10): don't generate tweet content until after
        // HANDOFF is complete and a voice blend is configured. The calibration
        // analysis above is sufficient commentary during onboarding.
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          console.warn("Calibration timed out (30s limit hit)");
        } else {
          console.error("Calibration failed:", err);
        }

        // Fallback to Track-A-like dimensions so the user sees non-default
        // values and the crafting gate becomes passable.
        dispatch({
          type: "SET_DIMENSIONS",
          dimensions: TRACK_A_INITIAL_DIMENSIONS,
        });
        // Surface a friendly Oracle message, then silently advance so the
        // user isn't stuck and doesn't see a raw error echoed as their reply.
        dispatch({
          type: "ENQUEUE_MESSAGES",
          messages: [
            {
              id: `calibration-skip-${Date.now()}`,
              role: "oracle" as const,
              content:
                "I couldn't scan your tweets right now — no worries, we can calibrate later. Let's keep going.",
              timestamp: Date.now(),
            },
          ],
        });
        dispatch({ type: "ADVANCE", payload: undefined });
      } finally {
        calibratingRef.current = false;
      }
    })();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [state.currentStep, state.xHandle, state.calibrationResult]);

  // ── Render inline components ─────────────────────────────────────
  const renderComponent = useCallback(
    (type: string): ReactNode => {
      switch (type) {
        case "scan-progress":
          return (
            <div className="bg-atlas-surface rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                {state.calibrationResult ? (
                  <CheckCircle className="h-4 w-4 text-atlas-teal" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-atlas-teal" />
                )}
                <span className="text-sm text-atlas-text-secondary">
                  {state.calibrationResult
                    ? `Calibrated from ${state.calibrationResult.tweetsAnalyzed} tweets`
                    : `Scanning @${state.xHandle}...`}
                </span>
              </div>
            </div>
          );

        case "dimensions":
          return (
            <div className="bg-atlas-surface/50 rounded-2xl p-4">
              <VoiceDimensionSections
                values={state.dimensions}
                interactive
                onChange={(field, value) =>
                  dispatch({
                    type: "SET_DIMENSIONS",
                    dimensions: { ...state.dimensions, [field]: value },
                  })
                }
              />
            </div>
          );


        case "style-picker":
          return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {styleOptions.map(({ label, description }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    dispatch({ type: "SET_STYLE", style: label });
                    dispatch({
                      type: "SET_DIMENSIONS",
                      dimensions: styleToDimensions(label),
                    });
                  }}
                  className={`rounded-2xl bg-atlas-surface p-4 text-center transition-all ${
                    state.selectedStyle === label
                      ? "border border-atlas-teal ring-1 ring-atlas-teal text-atlas-text"
                      : "border border-glass-border text-atlas-text-secondary hover:border-atlas-text-secondary"
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <p className="mt-1 text-xs text-atlas-text-muted">
                    {description}
                  </p>
                </button>
              ))}
            </div>
          );

        case "references":
          return (
            <ReferenceVoiceSelector
              accounts={REFERENCE_ACCOUNT_FALLBACK}
              selected={state.selectedRefs}
              onSelectionChange={(ids) =>
                dispatch({ type: "SET_REFS", ids })
              }
              onContinue={handleContinue} // Continue handled by ActionZone
            />
          );

        case "blend":
          // BLEND step is skipped in onboarding — advanced blending lives in Voice Labs.
          return null;

        case "voice-name-input":
          return (
            <div className="bg-atlas-surface rounded-2xl p-4">
              <input
                type="text"
                value={state.blendName}
                onChange={(e) =>
                  dispatch({ type: "SET_BLEND_NAME", name: e.target.value })
                }
                placeholder="Name your voice"
                className="w-full rounded-xl bg-atlas-bg border border-glass-border px-4 py-3 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:outline-none focus:border-atlas-teal"
              />
            </div>
          );

        case "topics":
          return (
            <TopicPicker
              selected={state.selectedTopics}
              onChange={(topics) =>
                dispatch({ type: "SET_TOPICS", topics })
              }
            />
          );

        case "content-signals":
          return (
            <div className="space-y-3">
              <ContentInput
                placeholder="Paste tweet URLs or drop a report/article..."
                showMic={false}
                onTextChange={() => {}}
                onTextSubmit={() => true}
              />
              <ContentSignalsPreview />
              <p className="text-xs text-atlas-text-muted">
                You can also send these via Telegram later.
              </p>
            </div>
          );

        case "handoff-telegram":
          return (
            <div className="bg-atlas-surface rounded-2xl p-6 space-y-4">
              <p className="text-sm text-atlas-text-secondary">
                Connect Telegram to send reports, voice notes, and get alerts on
                the go.
              </p>
              <a
                href="https://t.me/AtlasDelphiBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-atlas-teal text-sm hover:underline"
              >
                Connect @AtlasDelphiBot →
              </a>
              <div className="pt-2">
                <GradientButton
                  fullWidth
                  onClick={() => {
                    // Mark onboarding complete so crafting stays gated until HANDOFF.
                    // Best-effort — navigate regardless of whether the API call succeeds.
                    if (state.track === "a" || state.track === "b") {
                      api.users
                        .updateProfile({
                          onboardingTrack:
                            state.track === "a" ? "TRACK_A" : "TRACK_B",
                        })
                        .catch(() => {});
                    }
                    router.push(getOnboardingCompletionHref(state.track));
                  }}
                >
                  Go to Dashboard
                </GradientButton>
              </div>
            </div>
          );

        case "x-oauth":
          // Once we've moved past CONNECT_X, hide this widget from message history.
          // The button must disappear after skip-x so tests and the UX are consistent.
          if (state.currentStep !== "CONNECT_X") return null;
          return (
            <div className="bg-atlas-surface rounded-2xl p-6 space-y-4">
              <button
                type="button"
                disabled={oauthLoading}
                onClick={async () => {
                  setOauthLoading(true);
                  try {
                    const { url } = await api.auth.x.authorize();
                    localStorage.setItem("x_oauth_source", "onboarding");
                    window.location.href = url;
                  } catch {
                    setOauthLoading(false);
                  }
                }}
                className="w-full rounded-xl bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {oauthLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect your X account"
                )}
              </button>
              <p className="text-xs text-atlas-text-muted text-center">
                We\u2019ll scan your tweets to learn your writing voice
              </p>
            </div>
          );

        default:
          return null;
      }
    },
    [oauthLoading, router, state, blendSaveStatus]
  );

  // ── Determine ActionZone config per step ─────────────────────────
  const getActionZoneConfig = () => {
    const step = state.currentStep;
    const hasPending = state.pendingMessages.length > 0 || state.isTyping;

    // Don't show actions while messages are draining
    if (hasPending) return { disabled: true };

    // Terminal step — handoff has its own button inside the component
    if (step === "HANDOFF") return {};

    // Steps that need a Continue button
    const continueSteps = [
      "TRACK_A_RESULT",
      "TRACK_B_STYLE",
      "TRACK_B_DIMENSIONS",
      "REFERENCES",
      "NAME_VOICE",
    ];

    if (continueSteps.includes(step)) {
      return {
        actions: [
          {
            label: getContinueLabel(step, state.track),
            value: "continue",
            variant: "primary" as const,
          },
        ],
        disabled: !canAdvance(state),
      };
    }

    return {};
  };

  const actionConfig = getActionZoneConfig();
  const trackMeta = getTrackMeta(state.track);

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-atlas-bg via-atlas-nav to-atlas-bg pt-14">
      <NavBar variant="onboarding" />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-glass-border bg-atlas-nav/50 backdrop-blur-xl">
        <OracleAvatar size="md" />
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-sm text-atlas-text">
            The Oracle
          </h1>
          <p className="text-xs text-atlas-teal">DELPHI OS</p>
        </div>
        <TrackBadge meta={trackMeta} />
      </div>

      {/* Message list — aria-live so screen readers announce Oracle replies as they arrive */}
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Oracle conversation"
        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-8 space-y-4"
      >
        {state.messages.map((msg, i) => (
          <OracleMessage
            key={msg.id}
            message={msg}
            isLast={i === state.messages.length - 1}
            renderComponent={renderComponent}
            onAction={handleAction}
          />
        ))}

        {state.isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Action zone */}
      <ActionZone
        actions={actionConfig.actions}
        disabled={actionConfig.disabled}
        onAction={(value) => {
          if (value === "continue") {
            handleContinue();
          } else {
            handleAction(value);
          }
        }}
      />
    </div>
  );
}
