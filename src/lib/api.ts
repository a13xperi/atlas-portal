import * as Sentry from "@sentry/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;

interface RequestOptions {
  method?: string;
  body?: unknown;
}

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Token store — fallback when HttpOnly cookies don't reach cross-origin
// Uses sessionStorage for persistence across client-side navigations
const TOKEN_KEY = "atlas_access_token";
let _accessToken: string | null = typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (typeof window !== "undefined") {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }
}
export function getAccessToken() { return _accessToken; }

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        const message = err.error || err.message || "Request failed";
        const apiErr = new ApiError(message, res.status);

        if (!RETRYABLE_STATUSES.has(res.status) || attempt === MAX_RETRIES - 1) {
          Sentry.captureException(apiErr, {
            extra: { path, method, statusCode: res.status },
          });
          throw apiErr;
        }
        // Fall through to retry
      } else {
        return res.json();
      }
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof ApiError && !RETRYABLE_STATUSES.has(e.statusCode)) throw e;
      if (attempt === MAX_RETRIES - 1) throw e;
      // Network errors and retryable status codes fall through to retry
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)));
  }

  throw new Error("Request failed after retries");
}

// Auth — all requests use HttpOnly cookies (credentials: 'include')
export const api = {
  auth: {
    register: (handle: string, email: string, password: string, onboardingTrack?: string) =>
      request<{ user: User; token: string; refresh_token: string }>("/api/auth/register", {
        method: "POST",
        body: { handle, email, password, onboardingTrack },
      }),
    login: (email: string, password: string) =>
      request<{ user: User; token: string; refresh_token: string }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    refresh: () =>
      request<{ token: string; refresh_token: string }>("/api/auth/refresh", {
        method: "POST",
      }),
    logout: () =>
      request<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
    me: () =>
      request<{ user: User & { voiceProfile: VoiceProfile } }>("/api/auth/me"),
  },

  voice: {
    getProfile: () =>
      request<{ profile: VoiceProfile }>("/api/voice/profile"),
    updateProfile: (data: Partial<VoiceProfile>) =>
      request<{ profile: VoiceProfile }>("/api/voice/profile", { method: "PATCH", body: data }),
    getReferences: () =>
      request<{ voices: ReferenceVoice[] }>("/api/voice/references"),
    addReference: (name: string, handle?: string) =>
      request<{ voice: ReferenceVoice }>("/api/voice/references", { method: "POST", body: { name, handle } }),
    getBlends: () =>
      request<{ blends: SavedBlend[] }>("/api/voice/blends"),
    createBlend: (name: string, voices: BlendVoiceInput[]) =>
      request<{ blend: SavedBlend }>("/api/voice/blends", { method: "POST", body: { name, voices } }),
    calibrate: (handle: string) =>
      request<{ profile: VoiceProfile; calibration: CalibrationResult }>("/api/voice/calibrate", {
        method: "POST", body: { handle },
      }),
  },

  drafts: {
    list: (status?: string) =>
      request<{ drafts: TweetDraft[] }>(`/api/drafts${status ? `?status=${status}` : ""}`),
    get: (id: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}`),
    create: (content: string, sourceType?: string, sourceContent?: string) =>
      request<{ draft: TweetDraft }>("/api/drafts", { method: "POST", body: { content, sourceType, sourceContent } }),
    generate: (sourceContent: string, sourceType: string, blendId?: string) =>
      request<{ draft: TweetDraft }>("/api/drafts/generate", {
        method: "POST", body: { sourceContent, sourceType, blendId },
      }),
    regenerate: (draftId: string, feedback?: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${draftId}/regenerate`, {
        method: "POST", body: { feedback },
      }),
    update: (id: string, data: { content?: string; status?: string; feedback?: string }) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}`, { method: "PATCH", body: data }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/drafts/${id}`, { method: "DELETE" }),
    refine: (draftId: string, instruction: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${draftId}/refine`, { method: "POST", body: { instruction } }),
    team: (limit = 50) =>
      request<{ drafts: TeamDraft[]; total: number }>(`/api/drafts/team?limit=${limit}`),
  },

  analytics: {
    summary: () =>
      request<{ summary: AnalyticsSummary }>("/api/analytics/summary"),
    learningLog: () =>
      request<{ entries: LearningLogEntry[] }>("/api/analytics/learning-log"),
    engagement: () =>
      request<{ events: AnalyticsEvent[] }>("/api/analytics/engagement"),
    engagementDaily: () =>
      request<{ days: DailyEngagement[] }>("/api/analytics/engagement-daily"),
    activityDaily: () =>
      request<{ days: DailyActivity[] }>("/api/analytics/activity-daily"),
    teamEngagementDaily: () =>
      request<{ days: DailyTeamEngagement[] }>("/api/analytics/team-engagement-daily"),
    team: () =>
      request<{ analysts: TeamAnalyst[] }>("/api/analytics/team"),
    daysToPeak: () =>
      request<{ peaks: AnalystPeak[] }>("/api/analytics/days-to-peak"),
  },

  alerts: {
    feed: () =>
      request<{ alerts: Alert[] }>("/api/alerts/feed"),
    subscriptions: () =>
      request<{ subscriptions: AlertSubscription[] }>("/api/alerts/subscriptions"),
    subscribe: (type: string, value: string, delivery?: string[]) =>
      request<{ subscription: AlertSubscription }>("/api/alerts/subscriptions", { method: "POST", body: { type, value, delivery } }),
  },

  images: {
    generate: (prompt: string, style?: string) =>
      request<{ image: GeneratedImage }>("/api/images/generate", { method: "POST", body: { prompt, style } }),
    generateForDraft: (draftId: string, style?: string) =>
      request<{ image: GeneratedImage }>("/api/images/generate-for-draft", { method: "POST", body: { draftId, style } }),
    forDraft: (draftId: string) =>
      request<{ images: GeneratedImage[] }>(`/api/images/for-draft/${draftId}`),
  },

  trending: {
    scan: () =>
      request<{ alerts: Alert[] }>("/api/trending/scan", { method: "POST" }),
    topics: () =>
      request<{ topics: TrendingTopic[] }>("/api/trending/topics"),
  },

  research: {
    conduct: (query: string) =>
      request<{ result: ResearchResultData }>("/api/research", { method: "POST", body: { query } }),
    history: () =>
      request<{ results: ResearchResultData[] }>("/api/research/history"),
  },

  loop: {
    state: () =>
      request<{ loop: LoopState }>("/api/loop/state"),
    createPR: (branch: string, taskId: string) =>
      request<{ prUrl: string }>("/api/loop/create-pr", {
        method: "POST", body: { branch, taskId },
      }),
  },

  users: {
    profile: () =>
      request<{ user: User }>("/api/users/profile"),
    updateProfile: (data: { displayName?: string; email?: string }) =>
      request<{ user: User }>("/api/users/profile", { method: "PATCH", body: data }),
    team: () =>
      request<{ team: TeamMember[] }>("/api/users/team"),
    pushTopProfiles: () =>
      request<{ message: string; affected: number }>("/api/users/push-top-profiles", { method: "POST" }),
    sendNudge: () =>
      request<{ message: string; affected: number }>("/api/users/send-nudge", { method: "POST" }),
    pushStyle: (blendId?: string) =>
      request<{ message: string; affected: number }>("/api/users/push-style", { method: "POST", body: { blendId } }),
  },
};

// Types
export interface User {
  id: string;
  handle: string;
  role: "ANALYST" | "MANAGER" | "ADMIN";
  displayName?: string;
  email?: string;
}

export interface VoiceProfile {
  id: string;
  userId: string;
  humor: number;
  formality: number;
  brevity: number;
  contrarianTone: number;
  maturity: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  tweetsAnalyzed: number;
}

export interface CalibrationResult {
  confidence: number;
  analysis: string;
  tweetsAnalyzed: number;
  twitterUser: { username: string; name: string };
}

export interface ReferenceVoice {
  id: string;
  name: string;
  handle?: string;
  isActive: boolean;
}

export interface SavedBlend {
  id: string;
  name: string;
  voices: { label: string; percentage: number; referenceVoice?: ReferenceVoice }[];
}

export interface BlendVoiceInput {
  label: string;
  percentage: number;
  referenceVoiceId?: string;
}

export interface TweetDraft {
  id: string;
  content: string;
  version: number;
  status: "DRAFT" | "APPROVED" | "POSTED" | "ARCHIVED";
  confidence?: number;
  predictedEngagement?: number;
  actualEngagement?: number;
  sourceType?: string;
  sourceContent?: string;
  blendId?: string;
  feedback?: string;
  createdAt: string;
}

export interface TeamDraft extends TweetDraft {
  blendName: string | null;
  user: {
    handle: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface AnalyticsSummary {
  draftsCreated: number;
  draftsPosted: number;
  feedbackGiven: number;
  refinements: number;
  reportsIngested: number;
  period: string;
}

export interface LearningLogEntry {
  id: string;
  event: string;
  impact: string;
  positive: boolean;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  value?: number;
  metadata?: unknown;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: string;
  title: string;
  context?: string;
  draftReply?: string;
  createdAt: string;
}

export interface AlertSubscription {
  id: string;
  type: string;
  value: string;
  isActive: boolean;
  delivery: string[];
}

export interface TeamAnalyst {
  id: string;
  handle: string;
  voiceProfile?: VoiceProfile;
  _count: { tweetDrafts: number; analyticsEvents: number; sessions: number };
}

export interface GeneratedImage {
  id: string;
  draftId?: string;
  prompt: string;
  style: string;
  imageUrl: string;
  mimeType: string;
  concept?: {
    concept: string;
    colorScheme: string[];
    layout: string;
    elements: string[];
  };
  createdAt: string;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  headline: string;
  context?: string;
  sourceUrl?: string;
  sentiment?: string;
  relevance?: number;
}

export interface ResearchResultData {
  id: string;
  query: string;
  summary: string;
  keyFacts: string[];
  sentiment: "bullish" | "bearish" | "neutral" | "mixed";
  relatedTopics: string[];
  sources: string[];
  confidence: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  handle: string;
  displayName?: string;
  role: string;
  voiceProfile?: VoiceProfile;
  _count: { tweetDrafts: number; sessions: number };
}

export interface DailyEngagement {
  date: string;
  dayLabel: string;
  predicted: number;
  actual: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface DailyTeamEngagement {
  date: string;
  dayLabel: string;
  modelTarget: number;
  teamActual: number;
}

export interface AnalystPeak {
  name: string;
  days: number;
  hasDrafts: boolean;
}

export interface LoopIteration {
  iteration: number;
  score: number;
  branch: string;
  timestamp: string;
}

export interface LoopState {
  taskId: string;
  status: "running" | "completed" | "failed" | "idle";
  currentIteration: number;
  maxIterations: number;
  iterations: LoopIteration[];
  bestIteration: LoopIteration | null;
  evalType: string;
  startedAt: string | null;
  completedAt: string | null;
}
