"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useId,
  type DragEvent as ReactDragEvent,
} from "react";
import {
  Archive,
  Check,
  CheckCircle,
  ChevronRight,
  Clipboard,
  Link2,
  Loader2,
  Mic,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import DraftHistorySidebar, {
  DraftHistoryItem,
} from "@/components/crafting/DraftHistorySidebar";
import NewsMode from "@/components/crafting/NewsMode";
import ContentInput from "@/components/ui/ContentInput";
import { useVoiceRecorder } from "@/lib/useVoiceRecorder";
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

const TWEET_TEMPLATES = [
  { label: "Hot Take", template: "Unpopular opinion: " },
  { label: "Thread Starter", template: "🧵 Here's what most people get wrong about " },
  { label: "Data Insight", template: "The data shows something interesting: " },
  { label: "Prediction", template: "Bold prediction: by end of Q4, " },
  { label: "Question", template: "Genuine question for CT: " },
] as const;

const NEWS_SOURCE_PREFIX = "source:";
const VOICE_COMPARISON_DELTA = { humor: 20 } as const;

type CraftingMode = (typeof CRAFTING_MODES)[number]["id"];
type DraftSourceType = "REPORT" | "ARTICLE" | "MANUAL";
type VoiceComparisonOption = {
  draft: TweetDraft;
  label: string;
  summary: string;
  ctaLabel: string;
};

const DRAFT_STATUS_LABELS: Record<TweetDraft["status"], string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
  ARCHIVED: "Archived",
};

const DRAFT_STATUS_PILL_STYLES: Record<TweetDraft["status"], string> = {
  DRAFT: "bg-atlas-surface text-atlas-text-secondary",
  APPROVED: "bg-atlas-teal/20 text-atlas-teal",
  SCHEDULED: "bg-delphi-blue-500/20 text-delphi-blue-400",
  POSTED: "bg-atlas-success/20 text-atlas-success",
  ARCHIVED: "bg-atlas-text-muted/20 text-atlas-text-muted",
};

const DRAFT_STATUS_HINTS: Record<TweetDraft["status"], string> = {
  DRAFT: "Review and approve when ready",
  APPROVED: "Ready to post",
  SCHEDULED: "Scheduled for auto-posting",
  POSTED: "Published",
  ARCHIVED: "Archived",
};

const DRAFT_WORKFLOW_STEPS: { status: TweetDraft["status"]; label: string }[] = [
  { status: "DRAFT", label: "Draft" },
  { status: "APPROVED", label: "Approved" },
  { status: "POSTED", label: "Posted" },
];

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

function isTextFile(file: File) {
  return (
    file.type.startsWith("text/") ||
    file.type === "application/pdf" ||
    /\.(txt|md|csv|json|ya?ml|log|pdf)$/i.test(file.name)
  );
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    if (text.trim()) pages.push(text.trim());
  }

  return pages.join("\n\n");
}

function clampVoiceValue(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatVoiceScore(value: number) {
  return `${Math.round(clampVoiceValue(value) / 10)}/10`;
}

function getWordCount(content: string) {
  return content.split(/\s+/).filter(Boolean).length;
}

function buildVoiceVariationInstruction(
  currentHumor: number,
  variantHumor: number,
  formality: number,
  brevity: number,
  contrarianTone: number
) {
  return [
    "Keep the user's calibrated voice profile intact, but create a subtle A/B variation.",
    `Increase humor from ${formatVoiceScore(currentHumor)} to ${formatVoiceScore(variantHumor)} while keeping the writing credible for crypto analysis.`,
    `Hold formality near ${formatVoiceScore(formality)}, brevity near ${formatVoiceScore(brevity)}, and contrarian tone near ${formatVoiceScore(contrarianTone)}.`,
    "The result should feel slightly more playful and witty without changing the core thesis or facts.",
  ].join(" ");
}

export default function CraftingPage() {
  const searchParams = useSearchParams();
  const voiceModeLabelId = useId();
  const savedBlendLabelId = useId();
  const blendIntensityLabelId = useId();
  const regenerationGuidanceId = useId();
  const draftFeedbackHintId = useId();
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
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [voiceBanner, setVoiceBanner] = useState<string | null>(null);
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
  const [comparingVoices, setComparingVoices] = useState(false);
  const [voiceComparison, setVoiceComparison] = useState<{
    options: VoiceComparisonOption[];
  } | null>(null);
  const [draftInputText, setDraftInputText] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("content") || params.get("source") || params.get("draft") || "";
    }
    return "";
  });
  const [isContentDragActive, setIsContentDragActive] = useState(false);
  const [urlPreview, setUrlPreview] = useState<{
    title?: string;
    url: string;
  } | null>(null);
  const activeDraftInitialized = useRef(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const voiceRecorder = useVoiceRecorder(useCallback((text: string) => {
    handleDraftTextChange(text);
  }, []));
  const draftInputValueRef = useRef("");
  const handleCreateDraftRef = useRef<
    ((text?: string) => Promise<boolean | void>) | null
  >(null);
  const canReviseActiveDraft = activeDraft?.status === "DRAFT";
  const activeDraftWordCount = activeDraft?.content
    ? getWordCount(activeDraft.content)
    : 0;
  const activeDraftReadingTime = Math.max(
    1,
    Math.ceil(activeDraftWordCount / 200)
  );
  const currentHumor = clampVoiceValue(user?.voiceProfile?.humor);
  const currentFormality = clampVoiceValue(user?.voiceProfile?.formality);
  const currentBrevity = clampVoiceValue(user?.voiceProfile?.brevity);
  const currentContrarianTone = clampVoiceValue(user?.voiceProfile?.contrarianTone);
  const variantHumor = clampVoiceValue(currentHumor + VOICE_COMPARISON_DELTA.humor);
  const currentVoiceSummary = `Humor ${formatVoiceScore(currentHumor)}`;
  const variantVoiceSummary = `Humor ${formatVoiceScore(
    variantHumor
  )} (+${VOICE_COMPARISON_DELTA.humor})`;
  const voiceVariationInstruction = buildVoiceVariationInstruction(
    currentHumor,
    variantHumor,
    currentFormality,
    currentBrevity,
    currentContrarianTone
  );

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

  useEffect(() => {
    const voiceName = searchParams.get("voice");
    if (!voiceName || blends.length === 0) return;
    const match = blends.find((b) => b.name.toLowerCase() === voiceName.toLowerCase());
    if (match) {
      setVoiceMode("blended");
      setSelectedBlendId(match.id);
      setVoiceBanner(voiceName);
      setTimeout(() => setVoiceBanner(null), 6000);
    } else if (voiceName.toLowerCase() === "personal voice") {
      setVoiceMode("my_voice");
      setVoiceBanner("Personal Voice");
      setTimeout(() => setVoiceBanner(null), 6000);
    }
  }, [blends, searchParams]);

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
    setIsContentDragActive(false);
    setError(null);
    setContentError("");
    setSourceError("");
    setUrlPreview(null);
    setVoiceComparison(null);
    setCompareMode(false);
    setCompareVersion(null);
  };

  const prependDraftHistory = useCallback((draft: TweetDraft, sourceUrl?: string) => {
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
  }, []);

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

  const syncDraftReferences = (draft: TweetDraft, sourceUrl?: string) => {
    const normalizedDraft = updateDraftHistory(draft, sourceUrl);

    setDrafts((previousDrafts) =>
      previousDrafts.map((existingDraft) =>
        existingDraft.id === normalizedDraft.id ? normalizedDraft : existingDraft
      )
    );
    setDraftVersions((previousVersions) =>
      previousVersions.map((versionDraft) =>
        versionDraft.id === normalizedDraft.id &&
        versionDraft.version === normalizedDraft.version
          ? normalizedDraft
          : versionDraft
      )
    );
    setActiveDraft(normalizedDraft);

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
    setVoiceComparison(null);

    if (!draftInVersionHistory) {
      setDraftVersions([draft]);
      setCompareMode(false);
      setCompareVersion(null);
    }
  };

  const commitDraft = useCallback((
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
  }, [prependDraftHistory]);

  const validateDraftSubmission = useCallback((content: string, hasSource: boolean) => {
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
  }, []);

  const handleDraftTextChange = useCallback((text: string) => {
    draftInputValueRef.current = text;
    setDraftInputText(text);
    const trimmedText = text.trim();

    if (trimmedText.length > 2000) {
      setContentError("Content must be under 2000 characters.");
    } else if (contentError) {
      setContentError("");
    }

    if (sourceError && trimmedText) {
      setSourceError("");
    }
  }, [contentError, sourceError]);

  const createDraftFromSource = useCallback(async (
    content: string,
    sourceType: DraftSourceType,
    hasSource: boolean,
    angle?: string | null
  ) => {
    if (!user) return false;

    setError(null);
    const { isValid, trimmedContent } = validateDraftSubmission(content, hasSource);
    if (!isValid) return false;

    setCreating(true);
    try {
      const { draft } = await api.drafts.generate({
        sourceContent: trimmedContent,
        sourceType,
        blendId: selectedBlendId || undefined,
        replyAngle: angle || undefined,
      });
      setVoiceComparison(null);
      setCompareMode(false);
      setCompareVersion(null);
      setVisualConcept(null);
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
  }, [commitDraft, selectedBlendId, user, validateDraftSubmission]);

  const handleTextFileInput = useCallback(async (file: File) => {
    if (!isTextFile(file)) {
      setError("Supported formats: PDF, TXT, MD, CSV, JSON, YAML");
      return;
    }

    try {
      let text: string;

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }

      if (!text.trim()) {
        setError("The dropped file is empty or could not be read.");
        return;
      }

      // Truncate to 10k chars with a note
      const maxLen = 10000;
      if (text.length > maxLen) {
        text = text.slice(0, maxLen) + "\n\n[Content truncated at 10,000 characters]";
      }

      setError(null);
      handleDraftTextChange(text);
    } catch (fileDropError: unknown) {
      console.error("Failed to process file:", fileDropError);
      setError(
        fileDropError instanceof Error
          ? fileDropError.message
          : "Failed to process file. Try pasting the content instead."
      );
    }
  }, [handleDraftTextChange]);

  const handleFileDrop = useCallback(async (files: FileList) => {
    if (files.length === 0) {
      return;
    }

    await handleTextFileInput(files[0]);
  }, [handleTextFileInput]);

  const handleContentDragOver = useCallback((
    event: ReactDragEvent<HTMLDivElement>
  ) => {
    if (!Array.from(event.dataTransfer.types).includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsContentDragActive(true);
  }, []);

  const handleContentDragLeave = useCallback((
    event: ReactDragEvent<HTMLDivElement>
  ) => {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsContentDragActive(false);
  }, []);

  const handleContentDrop = useCallback(async (
    event: ReactDragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsContentDragActive(false);

    if (event.dataTransfer.files.length === 0) {
      return;
    }

    await handleFileDrop(event.dataTransfer.files);
  }, [handleFileDrop]);

  const getDraftGenerationInput = (
    text: string
  ): { content: string; hasSource: boolean; sourceType: DraftSourceType } => {
    const trimmedText = text.trim();

    return {
      content: text,
      hasSource: Boolean(trimmedText),
      sourceType:
        activeMode === "reply_to_tweet"
          ? "MANUAL"
          : trimmedText.startsWith("http")
            ? "ARTICLE"
            : "MANUAL",
    };
  };

  const handleCreateDraft = async (text = draftInputValueRef.current) => {
    const { content, hasSource, sourceType } = getDraftGenerationInput(text);
    const angle = activeMode === "reply_to_tweet" ? replyAngle : null;
    return createDraftFromSource(content, sourceType, hasSource, angle);
  };

  handleCreateDraftRef.current = handleCreateDraft;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleCreateDraftRef.current?.();
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleGenerateNews = async (articleUrl: string, fallbackText = "") => {
    if (!user) {
      return {};
    }

    const trimmedArticleUrl = articleUrl.trim();
    const trimmedFallbackText = fallbackText.trim();

    setCreating(true);
    setError(null);

    try {
      const { draft } = await api.drafts.generate({
        sourceContent: trimmedFallbackText || trimmedArticleUrl,
        sourceType: trimmedFallbackText ? "MANUAL" : "ARTICLE",
        blendId: selectedBlendId || undefined,
      });
      setVoiceComparison(null);
      setCompareMode(false);
      setCompareVersion(null);
      setVisualConcept(null);
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

  const handleUpdateDraftStatus = async (status: TweetDraft["status"]) => {
    if (!user || !activeDraft) return;

    setStatusUpdating(true);
    setError(null);

    try {
      const sourceUrl = extractSourceUrl(activeDraft);
      const { draft } = await api.drafts.update(activeDraft.id, { status });
      syncDraftReferences(draft, sourceUrl ?? undefined);
    } catch (statusError: unknown) {
      console.error(`Failed to update draft status to ${status}:`, statusError);
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update draft status"
      );
    } finally {
      setStatusUpdating(false);
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
        syncDraftReferences(draft, sourceUrl ?? undefined);
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

  const handleTryAgain = async (nextFeedback?: string) => {
    if (!user || !activeDraft) return;

    const trimmedFeedback = nextFeedback?.trim();

    setCreating(true);
    setError(null);

    try {
      const sourceUrl = extractSourceUrl(activeDraft);
      const { draft } = await api.drafts.regenerate(
        activeDraft.id,
        trimmedFeedback || undefined
      );
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
  const usageSummary =
    summary
      ? `This week you have given ${feedbackCount} feedback items and refined ${draftsRefined} drafts.`
      : "Usage summary will appear after you create and refine drafts.";
  const activeTabPanelId = `${activeMode}-panel`;

  const handleCompareVoices = async (text = draftInputValueRef.current) => {
    if (!user) {
      return false;
    }

    const { content: sourceContent, hasSource, sourceType } =
      getDraftGenerationInput(text);

    setError(null);
    const { isValid, trimmedContent } = validateDraftSubmission(
      sourceContent,
      hasSource
    );

    if (!isValid) {
      return false;
    }

    setCreating(true);
    setComparingVoices(true);
    setVoiceComparison(null);

    try {
      const [currentVoiceResult, variantVoiceResult] = await Promise.all([
        api.drafts.generate({
          sourceContent: trimmedContent,
          sourceType,
          blendId: selectedBlendId || undefined,
          replyAngle:
            activeMode === "reply_to_tweet" ? replyAngle || undefined : undefined,
        }),
        api.drafts.generate({
          sourceContent: trimmedContent,
          sourceType,
          blendId: selectedBlendId || undefined,
          replyAngle:
            activeMode === "reply_to_tweet" ? replyAngle || undefined : undefined,
          angleInstruction: voiceVariationInstruction,
        }),
      ]);

      const normalizedCurrentDraft = prependDraftHistory(currentVoiceResult.draft);
      const normalizedVariantDraft = prependDraftHistory(variantVoiceResult.draft);

      setDrafts((previousDrafts) => [
        normalizedCurrentDraft,
        normalizedVariantDraft,
        ...previousDrafts.filter(
          (draft) =>
            draft.id !== normalizedCurrentDraft.id &&
            draft.id !== normalizedVariantDraft.id
        ),
      ]);
      setDraftVersions([normalizedCurrentDraft]);
      setActiveDraft(normalizedCurrentDraft);
      setCompareMode(false);
      setCompareVersion(null);
      setVisualConcept(null);
      setVoiceComparison({
        options: [
          {
            draft: normalizedCurrentDraft,
            label: "Current profile",
            summary: currentVoiceSummary,
            ctaLabel: "Pick current voice",
          },
          {
            draft: normalizedVariantDraft,
            label: "Variation",
            summary: variantVoiceSummary,
            ctaLabel: "Pick funnier variation",
          },
        ],
      });
      activeDraftInitialized.current = true;

      return true;
    } catch (compareVoicesError: unknown) {
      console.error("Failed to generate voice comparison:", compareVoicesError);
      setError(
        compareVoicesError instanceof Error
          ? compareVoicesError.message
          : "Failed to compare voices"
      );
      return false;
    } finally {
      setCreating(false);
      setComparingVoices(false);
    }
  };

  const handlePickVoiceWinner = (draft: TweetDraft) => {
    setDrafts((previousDrafts) => [
      draft,
      ...previousDrafts.filter((existingDraft) => existingDraft.id !== draft.id),
    ]);
    setActiveDraft(draft);
    setDraftVersions([draft]);
    setCompareMode(false);
    setCompareVersion(null);
    setVoiceComparison(null);
    setVisualConcept(null);
    activeDraftInitialized.current = true;
  };

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
      {voiceBanner && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-atlas-teal/30 bg-atlas-teal/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-teal/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-atlas-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-atlas-teal">
                Now crafting with <span className="text-atlas-text">{voiceBanner}</span>
              </p>
              <p className="text-[10px] text-atlas-text-muted">
                All generated drafts will use this voice. Change it below.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setVoiceBanner(null)} className="text-atlas-text-muted hover:text-atlas-text transition-colors" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 sm:flex-row sm:items-center sm:gap-0 sm:rounded-3xl sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <svg
            aria-hidden="true"
            focusable="false"
            className="h-10 w-10 shrink-0"
            viewBox="0 0 40 40"
          >
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
          <div
            role="status"
            aria-live="polite"
            aria-label={usageSummary}
            className="flex flex-wrap gap-3 text-sm text-atlas-text-secondary sm:gap-6"
          >
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
              <p className="text-xs uppercase tracking-wide text-atlas-text-secondary">
                Trending now — click to craft a tweet
              </p>
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
                    id={`${mode.id}-tab`}
                    role="tab"
                    aria-controls={`${mode.id}-panel`}
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleModeChange(mode.id)}
                    className={`text-sm transition-colors ${
                      isActive
                        ? "rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-4 py-2 text-white"
                        : "px-4 py-2 text-atlas-text-secondary hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {activeMode === "news_to_post" ? (
              <div
                id={activeTabPanelId}
                role="tabpanel"
                aria-labelledby={`${activeMode}-tab`}
                className="mt-6"
              >
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
                          <Link2 className="h-5 w-5 text-atlas-teal" aria-hidden="true" />
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
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null
                  }
                />
              </div>
            ) : (
              <div
                id={activeTabPanelId}
                role="tabpanel"
                aria-labelledby={`${activeMode}-tab`}
                className="mt-6"
              >
                <p className="text-xs uppercase tracking-wide text-atlas-text-secondary">
                  {activeMode === "reply_to_tweet"
                    ? "Paste the tweet or quote you want Atlas to respond to."
                    : "Feed Atlas content — it crafts the tweet in your voice."}
                </p>
                {activeMode === "reply_to_tweet" ? (
                  <div className="mb-2 mt-4">
                    <ReplyAngleSelector
                      selectedAngle={replyAngle as "Direct" | "Curious" | "Concise"}
                      onAngleChange={setReplyAngle}
                    />
                  </div>
                ) : null}
                {activeMode === "reply_to_tweet" && draftInputText.trim() && activeDraft ? (
                  <div className="mt-3 rounded-xl border border-glass-border bg-atlas-surface/50 px-4 py-3">
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-atlas-text-muted">Replying to</p>
                    <p className="text-sm leading-relaxed text-atlas-text-secondary">{draftInputText}</p>
                  </div>
                ) : null}
                <div className="mt-3" data-tour="content-input">
                  <ContentInput
                    placeholder={
                      activeMode === "reply_to_tweet"
                        ? "Paste the tweet or quote you want to reply to…"
                        : "Paste a tweet idea or link…"
                    }
                    value={draftInputText}
                    contentDropActive={isContentDragActive}
                    onContentDragOver={handleContentDragOver}
                    onContentDragLeave={handleContentDragLeave}
                    onContentDrop={handleContentDrop}
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
                    recordingState={voiceRecorder.state}
                    recordingDuration={voiceRecorder.duration}
                    recordingError={voiceRecorder.error}
                    onMicClick={() => {
                      if (voiceRecorder.state === "recording") {
                        voiceRecorder.stopRecording();
                      } else if (voiceRecorder.state === "idle") {
                        voiceRecorder.startRecording();
                      }
                    }}
                  />
                  {activeMode === "new_post" && !draftInputText ? (
                    <div className="mt-3" data-tour="content-input">
                      <p className="mb-2 text-[10px] text-atlas-text-muted">
                        Start from a template
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {TWEET_TEMPLATES.map((templatePreset) => (
                          <button
                            key={templatePreset.label}
                            type="button"
                            onClick={() => handleDraftTextChange(templatePreset.template)}
                            className="rounded-full border border-glass-border bg-atlas-surface px-3 py-1.5 text-xs text-atlas-text-secondary transition-colors hover:border-atlas-teal/50 hover:text-atlas-text"
                          >
                            {templatePreset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" data-tour="generate-button">
                    <GradientButton
                      fullWidth
                      disabled={creating}
                      onClick={() => void handleCreateDraft()}
                    >
                      {creating && !comparingVoices ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Crafting your tweet…
                        </span>
                      ) : activeMode === "reply_to_tweet" ? (
                        "Generate Reply"
                      ) : (
                        "Generate Draft"
                      )}
                    </GradientButton>
                    <button
                      type="button"
                      onClick={() => void handleCompareVoices()}
                      disabled={creating}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-glass-border bg-glass px-4 py-3 text-sm font-medium text-atlas-text transition-colors hover:border-atlas-teal/50 hover:text-atlas-teal disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {comparingVoices ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Comparing voices…
                        </>
                      ) : (
                        "Compare Voices"
                      )}
                    </button>
                    <p className="mt-1 text-center text-[10px] text-atlas-text-muted sm:col-span-2">
                      ⌘↩ to generate
                    </p>
                  </div>
                  {error ? (
                    <div
                      role="alert"
                      className="mt-2 flex items-center justify-between rounded-lg border border-atlas-error/30 bg-atlas-error/10 px-3 py-2 text-sm text-atlas-error"
                    >
                      <span>{error}</span>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                        className="ml-2 transition-colors hover:text-atlas-text"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col flex-wrap items-stretch gap-4 rounded-2xl border border-glass-border bg-atlas-surface px-4 py-3 sm:flex-row sm:items-center sm:px-6">
            <label
              id={voiceModeLabelId}
              htmlFor="voice-mode"
              className="shrink-0 text-sm text-atlas-text-secondary"
            >
              Voice mode
            </label>
            <select
              id="voice-mode"
              aria-labelledby={voiceModeLabelId}
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
              <>
                <label
                  id={savedBlendLabelId}
                  htmlFor="saved-blend"
                  className="shrink-0 text-sm text-atlas-text-secondary"
                >
                  Saved blend
                </label>
                <select
                  id="saved-blend"
                  aria-labelledby={savedBlendLabelId}
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
              </>
            ) : null}
            <div className="flex w-full flex-col gap-2 sm:min-w-[200px] sm:flex-1 sm:flex-row sm:items-center sm:gap-3">
              <span
                id={blendIntensityLabelId}
                className="shrink-0 text-sm text-atlas-text-secondary"
              >
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
                aria-labelledby={blendIntensityLabelId}
                aria-valuetext={`${blendValue} percent`}
                className="flex-1"
                style={{ "--range-progress": `${blendValue}%` } as React.CSSProperties}
              />
              <span className="w-10 text-right text-sm text-atlas-text">{blendValue}%</span>
            </div>
          </div>

          {voiceComparison ? (
            <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-atlas-text-muted">
                    Voice A/B test
                  </p>
                  <h3 className="mt-2 font-heading font-bold tracking-tight text-2xl text-atlas-text">
                    Compare both voice directions side by side
                  </h3>
                  <p className="mt-2 text-sm text-atlas-text-secondary">
                    Pick the winner and Atlas will keep that draft active.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceComparison(null)}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/50 hover:text-atlas-text"
                >
                  Keep current draft view
                </button>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {voiceComparison.options.map((option) => (
                  <div
                    key={option.label}
                    className="rounded-2xl border border-glass-border bg-glass p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-atlas-text-muted">
                          {option.label}
                        </p>
                        <p className="mt-1 text-sm text-atlas-teal">{option.summary}</p>
                      </div>
                      <span className="rounded-full border border-glass-border px-2.5 py-1 text-[10px] text-atlas-text-muted">
                        {getWordCount(option.draft.content)} words
                      </span>
                    </div>
                    <div className="mt-4 rounded-xl border border-glass-border bg-atlas-bg/40 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-atlas-text">
                        {option.draft.content}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePickVoiceWinner(option.draft)}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      {option.ctaLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeDraft ? (
            <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-6">
              <textarea
                value={activeDraft.content}
                readOnly
                rows={6}
                aria-label="Generated draft"
                className="w-full resize-none bg-transparent text-atlas-text leading-relaxed focus:outline-none"
              />
              {activeDraft.content ? (
                <>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative h-5 w-5">
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="h-5 w-5 -rotate-90"
                          viewBox="0 0 20 20"
                        >
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-atlas-surface"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${Math.min(
                              (activeDraft.content.length / 280) * 50.3,
                              50.3
                            )} 50.3`}
                            className={
                              activeDraft.content.length > 280
                                ? "text-atlas-error"
                                : activeDraft.content.length > 250
                                  ? "text-atlas-warning"
                                  : activeDraft.content.length > 200
                                    ? "text-yellow-400"
                                    : "text-atlas-teal"
                            }
                          />
                        </svg>
                      </div>
                      <span
                        className={`text-xs font-mono ${
                          activeDraft.content.length > 280
                            ? "text-atlas-error"
                            : activeDraft.content.length > 250
                              ? "text-atlas-warning"
                              : activeDraft.content.length > 200
                                ? "text-yellow-400"
                                : "text-atlas-text-secondary"
                        }`}
                      >
                        {activeDraft.content.length}/280
                      </span>
                    </div>
                    {activeDraft.content.length > 280 ? (
                      <span className="text-xs text-atlas-error">
                        {activeDraft.content.length - 280} over limit
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-atlas-text-muted">
                    <span>{activeDraftWordCount} words</span>
                    <span>&middot;</span>
                    <span>~{activeDraftReadingTime} min read</span>
                  </div>
                  {activeDraft.confidence != null ||
                  activeDraft.predictedEngagement != null ? (
                    <div className="mt-3 flex items-center gap-4 border-t border-glass-border/50 pt-3">
                      {activeDraft.confidence != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative h-4 w-4">
                            <svg
                              aria-hidden="true"
                              focusable="false"
                              className="h-4 w-4 -rotate-90"
                              viewBox="0 0 16 16"
                            >
                              <circle
                                cx="8"
                                cy="8"
                                r="6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-atlas-surface"
                              />
                              <circle
                                cx="8"
                                cy="8"
                                r="6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray={`${
                                  activeDraft.confidence * 37.7
                                } 37.7`}
                                className={
                                  activeDraft.confidence > 0.8
                                    ? "text-atlas-teal"
                                    : activeDraft.confidence > 0.5
                                      ? "text-atlas-warning"
                                      : "text-atlas-error"
                                }
                              />
                            </svg>
                          </div>
                          <span className="text-[10px] text-atlas-text-muted">
                            {Math.round(activeDraft.confidence * 100)}% match
                          </span>
                        </div>
                      ) : null}
                      {activeDraft.predictedEngagement != null ? (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-atlas-text-muted" aria-hidden="true" />
                          <span className="text-[10px] text-atlas-text-muted">
                            ~{activeDraft.predictedEngagement.toLocaleString()} predicted
                            reach
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className="mt-4 border-t border-glass-border pt-4">
                <div className="flex items-center gap-1.5">
                  {DRAFT_WORKFLOW_STEPS.map((step, index) => {
                    const stepIndex = DRAFT_WORKFLOW_STEPS.findIndex(
                      (s) => s.status === activeDraft.status,
                    );
                    const isCompleted = index < stepIndex;
                    const isCurrent = step.status === activeDraft.status;

                    return (
                      <div key={step.status} className="flex items-center gap-1.5">
                        {index > 0 ? (
                          <ChevronRight
                            aria-hidden="true"
                            className={`h-3 w-3 ${
                              isCompleted
                                ? "text-atlas-success"
                                : "text-atlas-text-muted"
                            }`}
                          />
                        ) : null}
                        <span
                          className={`text-xs font-medium ${
                            isCurrent
                              ? "text-atlas-text"
                              : isCompleted
                                ? "text-atlas-success"
                                : "text-atlas-text-muted"
                          }`}
                        >
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="h-3 w-3" aria-hidden="true" />
                              {step.label}
                            </span>
                          ) : (
                            step.label
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${DRAFT_STATUS_PILL_STYLES[activeDraft.status]}`}
                    >
                      {DRAFT_STATUS_LABELS[activeDraft.status]}
                    </span>
                    <span className="text-xs text-atlas-text-muted">
                      {DRAFT_STATUS_HINTS[activeDraft.status]}
                    </span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex flex-wrap items-center gap-2">
                    {activeDraft.status === "DRAFT" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleUpdateDraftStatus("APPROVED")}
                          disabled={statusUpdating}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-atlas-teal/20 px-3 py-1.5 text-xs font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {statusUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <CheckCircle className="h-3 w-3" aria-hidden="true" />
                          )}
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleUpdateDraftStatus("ARCHIVED")}
                          disabled={statusUpdating}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-atlas-text-muted transition-colors hover:text-atlas-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Archive className="h-3 w-3" aria-hidden="true" />
                          Archive
                        </button>
                      </>
                    ) : null}
                    {activeDraft.status === "APPROVED" ? (
                      <button
                        type="button"
                        onClick={() => void handleUpdateDraftStatus("POSTED")}
                        disabled={statusUpdating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        ) : (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        )}
                        Mark as Posted
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void handleDelete(activeDraft.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-atlas-error/30 bg-atlas-error/10 px-3 py-1.5 text-sm text-atlas-error transition-colors hover:border-atlas-error hover:bg-atlas-error/15 focus:outline-none focus:border-atlas-error"
                >
                  <span className="text-xs">Delete draft</span>
                </button>
                <div className="flex items-center gap-3">
                  {activeDraft.status === "APPROVED" || activeDraft.status === "DRAFT" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setError(null);
                          // Check if X account is linked
                          const xStatus = await api.auth.x.status();
                          if (!xStatus.linked || xStatus.tokenExpired) {
                            // Start OAuth flow
                            const { url } = await api.auth.x.authorize();
                            window.location.href = url;
                            return;
                          }
                          // Post to X via backend
                          const result = await api.drafts.postToX(activeDraft.id);
                          setActiveDraft(result.draft);
                          syncDraftReferences(result.draft);
                        } catch (postError: unknown) {
                          console.error("Post to X failed:", postError);
                          // Fallback to intent
                          const text = encodeURIComponent(activeDraft.content);
                          window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "width=550,height=420");
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-glass-border bg-atlas-surface px-3 py-1.5 text-xs font-medium text-atlas-text transition-colors hover:border-atlas-teal/50"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Post to X
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    aria-label={
                      copiedDraftId === activeDraft.id
                        ? "Draft copied to clipboard"
                        : "Copy draft to clipboard"
                    }
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
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs" aria-live="polite">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs" aria-live="polite">
                          Copy
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Engagement Metrics — shown for POSTED drafts */}
              {activeDraft.status === "POSTED" ? (
                <div className="mt-4 rounded-xl border border-glass-border bg-atlas-surface/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-atlas-text-muted">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      Engagement
                    </p>
                    {activeDraft.actualEngagement ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const result = await api.drafts.fetchMetrics(activeDraft.id);
                            setActiveDraft(result.draft);
                            syncDraftReferences(result.draft);
                          } catch { /* silently fail */ }
                        }}
                        className="text-[10px] text-atlas-text-muted hover:text-atlas-teal transition-colors"
                      >
                        ↻ Refresh
                      </button>
                    ) : null}
                  </div>
                  {activeDraft.actualEngagement ? (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-atlas-text-muted text-xs">Impressions</span>
                        <p className="font-semibold text-atlas-text">{activeDraft.actualEngagement.toLocaleString()}</p>
                      </div>
                      {activeDraft.predictedEngagement ? (
                        <div className="ml-auto">
                          <span className="text-atlas-text-muted text-xs">vs Predicted</span>
                          <p className={`font-semibold text-sm ${
                            activeDraft.actualEngagement >= activeDraft.predictedEngagement
                              ? "text-atlas-success" : "text-atlas-warning"
                          }`}>
                            {activeDraft.actualEngagement >= activeDraft.predictedEngagement ? "↑" : "↓"}{" "}
                            {Math.abs(Math.round(((activeDraft.actualEngagement - activeDraft.predictedEngagement) / activeDraft.predictedEngagement) * 100))}%
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const result = await api.drafts.fetchMetrics(activeDraft.id);
                            setActiveDraft(result.draft);
                            syncDraftReferences(result.draft);
                          } catch {
                            setError("Could not fetch metrics — tweet may not have been posted via Atlas");
                          }
                        }}
                        className="rounded-lg bg-atlas-teal/20 px-4 py-2 text-xs font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/30"
                      >
                        Fetch from X
                      </button>
                      <span className="text-xs text-atlas-text-muted">
                        Metrics auto-update every few hours for tweets posted via Atlas
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-6 text-center text-atlas-text-secondary">
              <p>No drafts yet. Feed some content above to get started.</p>
            </div>
          )}

          {!voiceComparison && canReviseActiveDraft ? (
            <div className="mt-4">
              <RefinementChips
                onRefine={handleRefine}
                disabled={creating}
                loading={refiningChip}
              />
            </div>
          ) : null}

          {!voiceComparison && activeDraft ? (
            <VisualConceptSection
              generatingImage={generatingImage}
              onGenerateVisual={handleGenerateVisual}
              visualConcept={visualConcept}
            />
          ) : null}

          {!voiceComparison && versionDrafts.length > 0 ? (
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

          {!voiceComparison && canReviseActiveDraft ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <GradientButton
                variant="outline-warning"
                onClick={() => document.getElementById("feedback-input")?.focus()}
              >
                Not quite — tell me what&apos;s off
              </GradientButton>
              {!showFeedback ? (
                <button
                  type="button"
                  onClick={() => setShowFeedback(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-atlas-text-secondary transition-colors hover:border-atlas-teal/50 hover:text-atlas-text"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Regenerate
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <label htmlFor={regenerationGuidanceId} className="sr-only">
                    Describe how Atlas should regenerate the draft
                  </label>
                  <input
                    id={regenerationGuidanceId}
                    type="text"
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    placeholder="Make it shorter, more data-driven..."
                    className="flex-1 rounded-lg border border-glass-border bg-atlas-bg px-3 py-1.5 text-xs text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleTryAgain(feedbackText || undefined);
                        setFeedbackText("");
                        setShowFeedback(false);
                      }
                      if (event.key === "Escape") setShowFeedback(false);
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleTryAgain(feedbackText || undefined);
                      setFeedbackText("");
                      setShowFeedback(false);
                    }}
                    className="rounded-lg bg-atlas-teal px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Go
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {!voiceComparison && canReviseActiveDraft ? (
            <div className="mt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="feedback-input" className="sr-only">
                  Feedback for the current draft
                </label>
                <input
                  id="feedback-input"
                  aria-describedby={draftFeedbackHintId}
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
                  aria-label="Record voice feedback"
                  className="flex items-center justify-center rounded-lg border border-glass-border bg-atlas-surface p-3 text-atlas-text-secondary transition-colors hover:text-atlas-teal"
                >
                  <Mic className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p id={draftFeedbackHintId} className="mt-2 text-sm italic text-atlas-text-muted">
                Don&apos;t worry about hurting my feelings.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
