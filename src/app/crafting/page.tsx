"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clipboard, Link2, Loader2, Mic, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import DraftHistorySidebar, {
  DraftHistoryItem,
} from "@/components/crafting/DraftHistorySidebar";
import NewsMode from "@/components/crafting/NewsMode";
import ContentInput from "@/components/ui/ContentInput";
import GradientButton from "@/components/ui/GradientButton";
import ReplyAngleSelector from "@/components/ui/ReplyAngleSelector";
import RefinementChips, {
  RefinementChipOption,
} from "@/components/ui/RefinementChips";
import {
  api,
  AnalyticsSummary,
  GeneratedImage,
  SavedBlend,
  TrendingTopic,
  TweetDraft,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

const CRAFTING_MODES = [
  { id: "new_post", label: "New Post" },
  { id: "reply_to_tweet", label: "Reply to Tweet" },
  { id: "news_to_post", label: "News to Post" },
] as const;

const NEWS_SOURCE_PREFIX = "source:";

type CraftingMode = (typeof CRAFTING_MODES)[number]["id"];

const DRAFT_STATUS_LABELS: Record<TweetDraft["status"], string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  POSTED: "Posted",
  ARCHIVED: "Archived",
};

const DRAFT_STATUS_PILL_STYLES: Record<TweetDraft["status"], string> = {
  DRAFT: "bg-atlas-surface text-atlas-text-secondary",
  APPROVED: "bg-atlas-teal/20 text-atlas-teal",
  POSTED: "bg-atlas-success/20 text-atlas-success",
  ARCHIVED: "bg-atlas-text-muted/20 text-atlas-text-muted",
};

const VisualConceptSection = dynamic(
  () => import("@/components/crafting/VisualConceptSection"),
  {
    loading: () => (
      <div className="mt-4 h-64 rounded-2xl bg-atlas-surface animate-pulse" />
    ),
    ssr: false,
  }
);

function appendSourceUrl(content: string, sourceUrl?: string) {
  const trimmedContent = content.trimEnd();
  const trimmedSourceUrl = sourceUrl?.trim();

  if (!trimmedContent || !trimmedSourceUrl) {
    return trimmedContent;
  }

  const sourceLine = `${NEWS_SOURCE_PREFIX} ${trimmedSourceUrl}`;

  if (trimmedContent.includes(sourceLine)) {
    return trimmedContent;
  }

  return `${trimmedContent}\n\n${sourceLine}`;
}

function extractSourceUrl(draft: TweetDraft | null) {
  if (!draft) {
    return null;
  }

  const contentMatch = draft.content.match(/source:\s*(https?:\/\/\S+)/i);

  if (contentMatch?.[1]) {
    return contentMatch[1];
  }

  const trimmedSourceContent = draft.sourceContent?.trim();

  if (trimmedSourceContent?.startsWith("http")) {
    return trimmedSourceContent;
  }

  return null;
}

function normalizeDraftWithSource(draft: TweetDraft, sourceUrl?: string) {
  return sourceUrl
    ? { ...draft, content: appendSourceUrl(draft.content, sourceUrl) }
    : draft;
}

function getDefaultCompareVersion(
  versionDrafts: TweetDraft[],
  activeVersion: number | null
) {
  const comparableDrafts = versionDrafts.filter(
    (draft) => draft.version !== activeVersion
  );

  if (comparableDrafts.length === 0) {
    return null;
  }

  if (activeVersion !== null) {
    const previousDrafts = comparableDrafts.filter(
      (draft) => draft.version < activeVersion
    );

    if (previousDrafts.length > 0) {
      return previousDrafts[previousDrafts.length - 1].version;
    }
  }

  return comparableDrafts[comparableDrafts.length - 1].version;
}

export default function CraftingPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([]);
  const [draftVersions, setDraftVersions] = useState<TweetDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<TweetDraft | null>(null);
  const [activeMode, setActiveMode] = useState<CraftingMode>("new_post");
  const [replyAngle, setReplyAngle] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<"my_voice" | "blended" | "specific">(
    "my_voice"
  );
  const [blends, setBlends] = useState<SavedBlend[]>([]);
  const [selectedBlendId, setSelectedBlendId] = useState<string | null>(null);
  const [blendValue, setBlendValue] = useState(30);
  const [feedback, setFeedback] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [visualConcept, setVisualConcept] = useState<GeneratedImage | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [refiningChip, setRefiningChip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentError, setContentError] = useState("");
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [urlPreview, setUrlPreview] = useState<{
    title?: string;
    url: string;
  } | null>(null);
  const activeDraftInitialized = useRef(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  const loadDrafts = useCallback(async () => {
    try {
      const { drafts: nextDrafts } = await api.drafts.list();
      setDrafts(nextDrafts);

      if (nextDrafts.length > 0 && !activeDraftInitialized.current) {
        setActiveDraft(nextDrafts[0]);
        setDraftVersions([nextDrafts[0]]);
        activeDraftInitialized.current = true;
      }
    } catch (loadDraftsError) {
      console.error("Failed to load drafts:", loadDraftsError);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const { summary: nextSummary } = await api.analytics.summary();
      setSummary(nextSummary);
    } catch (loadSummaryError) {
      console.error("Failed to load summary:", loadSummaryError);
    }
  }, []);

  const loadBlends = useCallback(async () => {
    try {
      const { blends: nextBlends } = await api.voice.getBlends();
      setBlends(nextBlends);
    } catch {
      // Blends are optional on this screen.
    }
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      const { topics } = await api.trending.topics();
      setTrendingTopics(topics);
    } catch {
      // Trending is optional — do not block the page.
    }
  }, []);

  useEffect(() => {
    loadDrafts();
    loadSummary();
    loadTrending();
    loadBlends();
  }, [loadBlends, loadDrafts, loadSummary, loadTrending]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!compareMode) {
      return;
    }

    if (!activeDraft || draftVersions.length < 2) {
      setCompareMode(false);
      setCompareVersion(null);
      return;
    }

    const hasValidCompareTarget =
      compareVersion !== null &&
      draftVersions.some(
        (draft) =>
          draft.version === compareVersion &&
          draft.version !== activeDraft.version
      );

    if (!hasValidCompareTarget) {
      setCompareVersion(
        getDefaultCompareVersion(draftVersions, activeDraft.version)
      );
    }
  }, [activeDraft, compareMode, compareVersion, draftVersions]);

  const handleModeChange = (mode: CraftingMode) => {
    setActiveMode(mode);
    setError(null);
    setContentError("");
    setSourceError("");
    setUrlPreview(null);
  };

  const prependDraftHistory = (draft: TweetDraft, sourceUrl?: string) => {
    const normalizedDraft = normalizeDraftWithSource(draft, sourceUrl);

    setDraftHistory((previousHistory) => {
      const existingItem = previousHistory.find(
        (historyItem) => historyItem.draft.id === normalizedDraft.id
      );
      const nextItem: DraftHistoryItem = {
        draft: normalizedDraft,
        copiedToClipboard: existingItem?.copiedToClipboard ?? false,
        generatedAt: existingItem?.generatedAt ?? new Date().toISOString(),
      };

      return [
        nextItem,
        ...previousHistory.filter(
          (historyItem) => historyItem.draft.id !== normalizedDraft.id
        ),
      ].slice(0, 20);
    });

    return normalizedDraft;
  };

  const updateDraftHistory = (draft: TweetDraft, sourceUrl?: string) => {
    const normalizedDraft = normalizeDraftWithSource(draft, sourceUrl);

    setDraftHistory((previousHistory) =>
      previousHistory.map((historyItem) =>
        historyItem.draft.id === normalizedDraft.id
          ? { ...historyItem, draft: normalizedDraft }
          : historyItem
      )
    );

    return normalizedDraft;
  };

  const markDraftAsCopied = (draft: TweetDraft) => {
    setDraftHistory((previousHistory) => {
      const existingItem = previousHistory.find(
        (historyItem) => historyItem.draft.id === draft.id
      );

      if (!existingItem) {
        return [
          ...previousHistory,
          {
            draft,
            copiedToClipboard: true,
            generatedAt: draft.createdAt,
          },
        ];
      }

      return previousHistory.map((historyItem) =>
        historyItem.draft.id === draft.id
          ? { ...historyItem, copiedToClipboard: true }
          : historyItem
      );
    });
  };

  const handleSelectDraft = (draft: TweetDraft) => {
    const draftInVersionHistory = draftVersions.some(
      (versionDraft) =>
        versionDraft.id === draft.id &&
        versionDraft.version === draft.version &&
        versionDraft.content === draft.content
    );

    setActiveDraft(draft);
    setVisualConcept(null);

    if (!draftInVersionHistory) {
      setDraftVersions([draft]);
      setCompareMode(false);
      setCompareVersion(null);
    }
  };

  const commitDraft = (
    draft: TweetDraft,
    sourceUrl?: string,
    previousVersion?: TweetDraft | null
  ) => {
    const normalizedDraft = prependDraftHistory(draft, sourceUrl);
    const normalizedPreviousVersion = previousVersion
      ? normalizeDraftWithSource(previousVersion, sourceUrl)
      : null;

    setDrafts((previousDrafts) => [
      normalizedDraft,
      ...previousDrafts.filter(
        (existingDraft) => existingDraft.id !== normalizedDraft.id
      ),
    ]);
    setDraftVersions((previousVersions) => {
      if (!normalizedPreviousVersion) {
        return [normalizedDraft];
      }

      const nextVersionsByNumber = new Map(
        previousVersions.map((versionDraft) => [versionDraft.version, versionDraft])
      );

      nextVersionsByNumber.set(
        normalizedPreviousVersion.version,
        normalizedPreviousVersion
      );
      nextVersionsByNumber.set(normalizedDraft.version, normalizedDraft);

      return Array.from(nextVersionsByNumber.values()).sort(
        (leftDraft, rightDraft) => leftDraft.version - rightDraft.version
      );
    });
    if (normalizedPreviousVersion) {
      setCompareVersion(normalizedPreviousVersion.version);
    } else {
      setCompareMode(false);
      setCompareVersion(null);
    }
    setActiveDraft(normalizedDraft);
    setVisualConcept(null);
    activeDraftInitialized.current = true;
  };

  const validateDraftSubmission = (content: string, hasSource: boolean) => {
    const trimmedContent = content.trim();
    let isValid = true;

    if (!trimmedContent) {
      setContentError("Content is required.");
      isValid = false;
    } else if (trimmedContent.length > 10000) {
      setContentError("Content must be under 10,000 characters.");
      isValid = false;
    } else {
      setContentError("");
    }

    if (!hasSource) {
      setSourceError("Select at least one source before generating.");
      isValid = false;
    } else {
      setSourceError("");
    }

    return { isValid, trimmedContent };
  };

  const handleDraftTextChange = (text: string) => {
    const trimmedText = text.trim();

    if (trimmedText.length > 2000) {
      setContentError("Content must be under 2000 characters.");
    } else if (contentError) {
      setContentError("");
    }

    if (sourceError && trimmedText) {
      setSourceError("");
    }
  };

  const createDraftFromSource = async (
    content: string,
    sourceType: "REPORT" | "ARTICLE" | "MANUAL",
    hasSource: boolean
  ) => {
    if (!user) return false;

    setError(null);
    const { isValid, trimmedContent } = validateDraftSubmission(content, hasSource);
    if (!isValid) return false;

    setCreating(true);
    try {
      const { draft } = await api.drafts.generate(
        trimmedContent,
        sourceType,
        selectedBlendId || undefined
      );
      commitDraft(draft);
      return true;
    } catch (createDraftError: unknown) {
      console.error("Failed to generate draft:", createDraftError);
      setError(
        createDraftError instanceof Error
          ? createDraftError.message
          : "Failed to generate draft"
      );
      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleFileDrop = async (files: FileList) => {
    if (!user || files.length === 0) return;

    const file = files[0];

    try {
      const text = await file.text();

      if (!text.trim()) {
        return;
      }

      await createDraftFromSource(text.trim().slice(0, 10000), "REPORT", true);
    } catch (fileDropError: unknown) {
      console.error("Failed to process file:", fileDropError);
      setError(
        fileDropError instanceof Error
          ? fileDropError.message
          : "Failed to process file"
      );
    }
  };

  const handleCreateDraft = async (text: string) => {
    const trimmedText = text.trim();
    const sourceType =
      activeMode === "reply_to_tweet"
        ? "MANUAL"
        : trimmedText.startsWith("http")
          ? "ARTICLE"
          : "MANUAL";

    if (sourceType === "MANUAL" && activeMode === "reply_to_tweet") {
      return createDraftFromSource(
        replyAngle ? `[Reply angle: ${replyAngle}] ${text}` : text,
        sourceType,
        Boolean(trimmedText)
      );
    }

    return createDraftFromSource(text, sourceType, Boolean(trimmedText));
  };

  const handleGenerateNews = async (articleUrl: string, fallbackText = "") => {
    if (!user) {
      return {};
    }

    const trimmedArticleUrl = articleUrl.trim();
    const trimmedFallbackText = fallbackText.trim();

    setCreating(true);
    setError(null);

    try {
      const { draft } = await api.drafts.generate(
        trimmedFallbackText || trimmedArticleUrl,
        trimmedFallbackText ? "MANUAL" : "ARTICLE",
        selectedBlendId || undefined
      );
      commitDraft(draft, trimmedArticleUrl);
      return { showFallback: Boolean(trimmedFallbackText) };
    } catch (generateNewsError: unknown) {
      console.error("Failed to generate news draft:", generateNewsError);

      if (!trimmedFallbackText) {
        setError("Could not fetch article. Paste the article text or key points.");
        return { showFallback: true };
      }

      setError(
        generateNewsError instanceof Error
          ? generateNewsError.message
          : "Failed to generate news draft"
      );
      return { showFallback: true };
    } finally {
      setCreating(false);
    }
  };

  const handleNewsUrlChange = (value: string) => {
    const trimmedValue = value.trim();

    if (activeMode === "news_to_post" && /^https?:\/\//.test(trimmedValue)) {
      try {
        const parsedUrl = new URL(trimmedValue);
        setUrlPreview({ url: parsedUrl.toString() });
        return;
      } catch {
        // Clear the preview when the input is not a valid URL yet.
      }
    }

    setUrlPreview(null);
  };

  const handleShip = async () => {
    if (!user || !activeDraft) return;

    setLoading(true);
    setError(null);

    try {
      const sourceUrl = extractSourceUrl(activeDraft);
      const { draft } = await api.drafts.update(activeDraft.id, { status: "APPROVED" });
      const normalizedDraft = updateDraftHistory(draft, sourceUrl ?? undefined);

      setActiveDraft(normalizedDraft);
      setDrafts((previousDrafts) =>
        previousDrafts.map((existingDraft) =>
          existingDraft.id === normalizedDraft.id
            ? normalizedDraft
            : existingDraft
        )
      );
    } catch (shipError: unknown) {
      console.error("Failed to ship draft:", shipError);
      setError(shipError instanceof Error ? shipError.message : "Failed to ship draft");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!user || !activeDraft || !feedback.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const sourceUrl = extractSourceUrl(activeDraft);
      const { draft } = await api.drafts.regenerate(activeDraft.id, feedback.trim());
      commitDraft(draft, sourceUrl ?? undefined, activeDraft);
      setFeedback("");
    } catch {
      try {
        const sourceUrl = extractSourceUrl(activeDraft);
        const { draft } = await api.drafts.update(activeDraft.id, {
          feedback: feedback.trim(),
        });
        const normalizedDraft = updateDraftHistory(draft, sourceUrl ?? undefined);

        setActiveDraft(normalizedDraft);
        setDrafts((previousDrafts) =>
          previousDrafts.map((existingDraft) =>
            existingDraft.id === normalizedDraft.id
              ? normalizedDraft
              : existingDraft
          )
        );
        setFeedback("");
      } catch (feedbackError: unknown) {
        console.error("Failed to submit feedback:", feedbackError);
        setError(
          feedbackError instanceof Error
            ? feedbackError.message
            : "Failed to submit feedback"
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleTryAgain = async () => {
    if (!user || !activeDraft) return;

    setCreating(true);
    setError(null);

    try {
      const sourceUrl = extractSourceUrl(activeDraft);
      const { draft } = await api.drafts.regenerate(activeDraft.id);
      commitDraft(draft, sourceUrl ?? undefined, activeDraft);
    } catch (tryAgainError: unknown) {
      console.error("Failed to regenerate:", tryAgainError);
      setError(
        tryAgainError instanceof Error ? tryAgainError.message : "Failed to regenerate draft"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRefine = async ({ label, instruction }: RefinementChipOption) => {
    if (!activeDraft) return;

    setRefiningChip(label);
    setError(null);

    try {
      const sourceUrl = extractSourceUrl(activeDraft);
      const { draft } = await api.drafts.refine(activeDraft.id, instruction);
      commitDraft(draft, sourceUrl ?? undefined, activeDraft);
    } catch (refineError: unknown) {
      setError(refineError instanceof Error ? refineError.message : "Refinement failed");
    } finally {
      setRefiningChip(null);
    }
  };

  const handleGenerateVisual = async (style = "quote_card") => {
    if (!user || !activeDraft) return;

    setGeneratingImage(true);
    setError(null);

    try {
      const { image } = await api.images.generateForDraft(activeDraft.id, style);
      setVisualConcept(image);
    } catch (generateVisualError: unknown) {
      console.error("Image generation failed:", generateVisualError);
      setError(
        generateVisualError instanceof Error
          ? generateVisualError.message
          : "Image generation failed"
      );
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!activeDraft || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(activeDraft.content);
      setCopiedDraftId(activeDraft.id);
      markDraftAsCopied(activeDraft);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedDraftId(null);
        copyResetTimeoutRef.current = null;
      }, 2000);
    } catch (copyDraftError: unknown) {
      console.error("Failed to copy draft:", copyDraftError);
      setError(
        copyDraftError instanceof Error
          ? copyDraftError.message
          : "Failed to copy draft"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft? This can't be undone.")) {
      return;
    }

    try {
      await api.drafts.delete(id);
      setDrafts((previousDrafts) =>
        previousDrafts.filter((draft) => draft.id !== id)
      );
      setDraftHistory((previousHistory) =>
        previousHistory.filter((historyItem) => historyItem.draft.id !== id)
      );
      setDraftVersions((previousVersions) =>
        previousVersions.filter((draft) => draft.id !== id)
      );
      setCopiedDraftId((currentDraftId) =>
        currentDraftId === id ? null : currentDraftId
      );

      if (activeDraft?.id === id) {
        setActiveDraft(null);
        setCompareMode(false);
        setCompareVersion(null);
        setVisualConcept(null);
        setFeedback("");
      }
    } catch (deleteDraftError: unknown) {
      console.error("Failed to delete draft:", deleteDraftError);
      setError(
        deleteDraftError instanceof Error
          ? deleteDraftError.message
          : "Failed to delete draft"
      );
    }
  };

  const draftHistoryById = new Map(
    draftHistory.map((historyItem) => [historyItem.draft.id, historyItem])
  );
  const draftHistoryItems = drafts.map((draft) => {
    const historyItem = draftHistoryById.get(draft.id);

    return {
      draft: historyItem?.draft ?? draft,
      copiedToClipboard: historyItem?.copiedToClipboard ?? false,
      generatedAt: historyItem?.generatedAt ?? draft.createdAt,
    };
  });
  const versionDrafts = draftVersions;
  const activeVersion = versionDrafts.findIndex(
    (draft) =>
      draft.id === activeDraft?.id &&
      draft.version === activeDraft?.version &&
      draft.content === activeDraft?.content
  );
  const compareDraft =
    compareVersion === null
      ? null
      : versionDrafts.find((draft) => draft.version === compareVersion) ?? null;
  const feedbackCount = summary?.feedbackGiven ?? 0;
  const draftsRefined = summary?.refinements ?? 0;
  const usagePercent = summary
    ? Math.min(
        (summary.draftsCreated / Math.max(summary.draftsCreated + 5, 1)) * 100,
        100
      )
    : 0;

  const handleToggleCompareMode = () => {
    if (compareMode) {
      setCompareMode(false);
      setCompareVersion(null);
      return;
    }

    const nextCompareVersion = getDefaultCompareVersion(
      versionDrafts,
      activeDraft?.version ?? null
    );

    setCompareVersion(nextCompareVersion);
    setCompareMode(nextCompareVersion !== null);
  };

  return (
    <AppShell>
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 sm:flex-row sm:items-center sm:gap-0 sm:rounded-3xl sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <svg className="h-10 w-10 shrink-0" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-atlas-text-muted"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-atlas-teal"
              strokeDasharray={`${(usagePercent / 100) * 100.5} ${100.5}`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <div className="flex flex-wrap gap-3 text-sm text-atlas-text-secondary sm:gap-6">
            <span>Feedback given: {feedbackCount} this week</span>
            <span>Drafts refined: {draftsRefined}</span>
          </div>
        </div>
        <Link href="/analytics" className="shrink-0 text-sm text-atlas-teal hover:underline">
          View full analytics →
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <DraftHistorySidebar
          drafts={draftHistoryItems}
          activeDraftId={activeDraft?.id ?? null}
          onSelectDraft={handleSelectDraft}
        />

        <div className="min-w-0 flex-1">
          {trendingTopics.length > 0 ? (
            <div id="trending-section">
              <label className="text-xs uppercase tracking-wide text-atlas-text-secondary">
                Trending now — click to craft a tweet
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {trendingTopics.slice(0, 6).map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      void createDraftFromSource(
                        `${topic.headline}. ${topic.context || ""}`,
                        "MANUAL",
                        true
                      )
                    }
                    className="rounded-full border border-glass-border bg-atlas-surface px-3 py-1.5 text-xs text-atlas-text transition-colors hover:border-atlas-teal hover:text-atlas-teal"
                  >
                    {topic.headline.length > 50
                      ? `${topic.headline.slice(0, 50)}…`
                      : topic.headline}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={trendingTopics.length > 0 ? "mt-6" : undefined}>
            <div
              role="tablist"
              aria-label="Crafting modes"
              className="inline-flex flex-wrap rounded-xl bg-glass p-1 backdrop-blur-xl"
            >
              {CRAFTING_MODES.map((mode) => {
                const isActive = activeMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleModeChange(mode.id)}
                    className={`text-sm transition-colors ${
                      isActive
                        ? "rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-steel px-4 py-2 text-white"
                        : "px-4 py-2 text-atlas-text-secondary hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {activeMode === "news_to_post" ? (
              <NewsMode
                creating={creating}
                error={error}
                onDismissError={() => setError(null)}
                onGenerateNews={handleGenerateNews}
                onArticleUrlChange={handleNewsUrlChange}
                urlPreviewCard={
                  activeMode === "news_to_post" && urlPreview ? (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-glass-border bg-atlas-surface p-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-atlas-teal/10">
                        <Link2 className="h-5 w-5 text-atlas-teal" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-atlas-text">
                          {urlPreview.title || "News Article"}
                        </p>
                        <p className="truncate text-xs text-atlas-text-muted">
                          {urlPreview.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUrlPreview(null)}
                        className="text-atlas-text-muted hover:text-atlas-text"
                        aria-label="Dismiss URL preview"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null
                }
              />
            ) : (
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wide text-atlas-text-secondary">
                  {activeMode === "reply_to_tweet"
                    ? "Paste the tweet or quote you want Atlas to respond to."
                    : "Feed Atlas content — it crafts the tweet in your voice."}
                </label>
                {activeMode === "reply_to_tweet" ? (
                  <div className="mb-2 mt-4">
                    <ReplyAngleSelector
                      selectedAngle={replyAngle as "Direct" | "Curious" | "Concise"}
                      onAngleChange={setReplyAngle}
                    />
                  </div>
                ) : null}
                <div className="mt-3">
                  <ContentInput
                    placeholder={
                      activeMode === "reply_to_tweet"
                        ? "Paste the tweet or quote you want to reply to…"
                        : "Paste a tweet idea or link…"
                    }
                    onTextSubmit={handleCreateDraft}
                    onTextChange={handleDraftTextChange}
                    onDrop={handleFileDrop}
                    onTrendingClick={() => {
                      const trendingSection = document.getElementById("trending-section");

                      if (trendingSection) {
                        trendingSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    sourceError={sourceError}
                    contentError={contentError}
                  />
                  <div className="mt-3">
                    <GradientButton
                      fullWidth
                      disabled={creating}
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>(
                          'input[placeholder*="Paste"]'
                        );
                        if (input?.value) {
                          void handleCreateDraft(input.value);
                        }
                      }}
                    >
                      {creating ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Crafting your tweet…
                        </span>
                      ) : activeMode === "reply_to_tweet" ? (
                        "Generate Reply"
                      ) : (
                        "Generate Draft"
                      )}
                    </GradientButton>
                  </div>
                  {error ? (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-atlas-error/30 bg-atlas-error/10 px-3 py-2 text-sm text-atlas-error">
                      <span>{error}</span>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="ml-2 transition-colors hover:text-atlas-text"
                      >
                        x
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col flex-wrap items-stretch gap-4 rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 sm:flex-row sm:items-center sm:px-6">
            <select
              value={voiceMode}
              onChange={(event) => {
                const nextMode = event.target.value as
                  | "my_voice"
                  | "blended"
                  | "specific";
                setVoiceMode(nextMode);

                if (nextMode === "my_voice") {
                  setSelectedBlendId(null);
                }
              }}
              className="w-full rounded-lg border border-glass-border bg-atlas-nav px-3 py-2 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none sm:w-auto"
            >
              <option value="my_voice">My voice</option>
              <option value="blended">Blended</option>
              <option value="specific">Specific person</option>
            </select>
            {voiceMode === "blended" && blends.length > 0 ? (
              <select
                value={selectedBlendId || ""}
                onChange={(event) => setSelectedBlendId(event.target.value || null)}
                className="w-full rounded-lg border border-glass-border bg-atlas-nav px-3 py-2 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none sm:w-auto"
              >
                <option value="">Pick a blend…</option>
                {blends.map((blend) => (
                  <option key={blend.id} value={blend.id}>
                    {blend.name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex w-full flex-col gap-2 sm:min-w-[200px] sm:flex-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="shrink-0 text-sm text-atlas-text-secondary">
                {selectedBlendId
                  ? `My Voice ↔ ${
                      blends.find((blend) => blend.id === selectedBlendId)?.name || "Blend"
                    }`
                  : "Blend:"}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={blendValue}
                onChange={(event) => setBlendValue(Number(event.target.value))}
                className="flex-1 accent-atlas-teal"
              />
              <span className="w-10 text-right text-sm text-atlas-text">{blendValue}%</span>
            </div>
          </div>

          {activeDraft ? (
            <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-6">
              <textarea
                value={activeDraft.content}
                readOnly
                rows={6}
                aria-label="Generated draft"
                className="w-full resize-none bg-transparent text-atlas-text leading-relaxed focus:outline-none"
              />
              {activeDraft.status === "APPROVED" ? (
                <span className="mt-3 inline-block rounded bg-atlas-success/10 px-2 py-1 text-xs text-atlas-success">
                  Shipped
                </span>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void handleDelete(activeDraft.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-atlas-error/30 bg-atlas-error/10 px-3 py-1.5 text-sm text-atlas-error transition-colors hover:border-atlas-error hover:bg-atlas-error/15 focus:outline-none focus:border-atlas-error"
                >
                  <span className="text-xs">Delete draft</span>
                </button>
                <div className="flex items-center gap-3">
                  <p
                    className={`text-xs ${
                      activeDraft.content.length >= 280
                        ? "text-atlas-error"
                        : activeDraft.content.length >= 260
                          ? "text-atlas-warning"
                          : "text-atlas-text-secondary"
                    }`}
                  >
                    {activeDraft.content.length} / 280
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    title={
                      copiedDraftId === activeDraft.id
                        ? "Copied!"
                        : "Copy to clipboard"
                    }
                    className={`inline-flex items-center gap-2 rounded-lg border border-glass-border bg-glass px-3 py-1.5 text-sm transition-colors hover:border-atlas-teal focus:outline-none focus:border-atlas-teal ${
                      copiedDraftId === activeDraft.id
                        ? "text-atlas-success"
                        : "text-atlas-text-secondary hover:text-atlas-teal"
                    }`}
                  >
                    {copiedDraftId === activeDraft.id ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="text-xs" aria-live="polite">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4" />
                        <span className="text-xs" aria-live="polite">
                          Copy
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-6 text-center text-atlas-text-secondary">
              <p>No drafts yet. Feed some content above to get started.</p>
            </div>
          )}

          {canReviseActiveDraft ? (
            <div className="mt-4">
              <RefinementChips
                onRefine={handleRefine}
                disabled={creating}
                loading={refiningChip}
              />
            </div>
          ) : null}

          {activeDraft ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-glass-border border-l-4 border-l-atlas-success bg-atlas-surface p-4">
                <p className="text-xs uppercase tracking-wider text-atlas-text-secondary">
                  Confidence
                </p>
                <p className="font-heading text-2xl font-bold text-atlas-success">
                  {activeDraft.confidence
                    ? `${Math.round(activeDraft.confidence * 100)}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-glass-border border-l-4 border-l-atlas-teal bg-atlas-surface p-4">
                <p className="text-xs uppercase tracking-wider text-atlas-text-secondary">
                  Predicted engagement
                </p>
                <p className="font-heading text-2xl font-bold text-atlas-teal">
                  {activeDraft.predictedEngagement
                    ? `~${(activeDraft.predictedEngagement / 1000).toFixed(1)}K`
                    : "—"}
                </p>
              </div>
            </div>
          ) : null}

          {activeDraft ? (
            <VisualConceptSection
              generatingImage={generatingImage}
              onGenerateVisual={handleGenerateVisual}
              visualConcept={visualConcept}
            />
          ) : null}

          {versionDrafts.length > 0 ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {versionDrafts.map((draft, index) => (
                  <button
                    key={draft.version}
                    type="button"
                    onClick={() => handleSelectDraft(draft)}
                    className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                      activeVersion === index
                        ? "border-b-2 border-atlas-teal text-atlas-teal"
                        : "text-atlas-text-secondary hover:text-atlas-text"
                    }`}
                  >
                    Version {draft.version}
                  </button>
                ))}

                {versionDrafts.length > 1 ? (
                  <button
                    type="button"
                    onClick={handleToggleCompareMode}
                    className={`rounded px-2 py-1 text-xs ${
                      compareMode
                        ? "bg-atlas-teal text-white"
                        : "text-atlas-text-secondary hover:text-atlas-text"
                    }`}
                  >
                    Compare
                  </button>
                ) : null}
              </div>

              {compareMode && versionDrafts.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="compare-version"
                    className="text-xs uppercase tracking-wide text-atlas-text-secondary"
                  >
                    Compare against
                  </label>
                  <select
                    id="compare-version"
                    value={compareVersion ?? ""}
                    onChange={(event) =>
                      setCompareVersion(
                        event.target.value ? Number(event.target.value) : null
                      )
                    }
                    className="rounded-lg border border-glass-border bg-atlas-surface px-3 py-2 text-sm text-atlas-text focus:border-atlas-teal focus:outline-none"
                  >
                    <option value="">Select a version</option>
                    {versionDrafts
                      .filter((draft) => draft.version !== activeDraft?.version)
                      .map((draft) => (
                        <option key={draft.version} value={draft.version}>
                          Version {draft.version}
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}

              {compareMode && activeDraft && compareDraft ? (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-glass-border bg-atlas-surface p-4">
                    <p className="mb-2 text-xs text-atlas-text-muted">
                      Version {compareDraft.version}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-atlas-text">
                      {compareDraft.content}
                    </p>
                  </div>
                  <div className="rounded-xl border border-atlas-teal/30 bg-atlas-surface p-4">
                    <p className="mb-2 text-xs text-atlas-teal">
                      Current (v{activeDraft.version})
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-atlas-text">
                      {activeDraft.content}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {canReviseActiveDraft ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <GradientButton
                variant="outline-warning"
                onClick={() => document.getElementById("feedback-input")?.focus()}
              >
                Not quite — tell me what&apos;s off
              </GradientButton>
              <GradientButton
                variant="outline-teal"
                onClick={handleTryAgain}
                disabled={creating}
              >
                {creating ? "Regenerating…" : "Try again"}
              </GradientButton>
            </div>
          ) : null}

          {canReviseActiveDraft ? (
            <div className="mt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="feedback-input"
                  type="text"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleFeedback();
                    }
                  }}
                  placeholder="Tell me what's off — type or drop a voice note."
                  className="flex-1 rounded-lg border border-glass-border bg-atlas-surface px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary focus:border-atlas-teal focus:outline-none"
                />
                <button
                  type="button"
                  className="flex items-center justify-center rounded-lg border border-glass-border bg-atlas-surface p-3 text-atlas-text-secondary transition-colors hover:text-atlas-teal"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-sm italic text-atlas-text-muted">
                Don&apos;t worry about hurting my feelings.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
