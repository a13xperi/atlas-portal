import * as Sentry from "@sentry/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
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

// Auth
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
    refresh: (refreshToken: string) =>
      request<{ token: string; refresh_token: string }>("/api/auth/refresh", {
        method: "POST",
        body: { refresh_token: refreshToken },
      }),
    me: (token: string) =>
      request<{ user: User & { voiceProfile: VoiceProfile } }>("/api/auth/me", { token }),
  },

  voice: {
    getProfile: (token: string) =>
      request<{ profile: VoiceProfile }>("/api/voice/profile", { token }),
    updateProfile: (token: string, data: Partial<VoiceProfile>) =>
      request<{ profile: VoiceProfile }>("/api/voice/profile", { method: "PATCH", token, body: data }),
    getReferences: (token: string) =>
      request<{ voices: ReferenceVoice[] }>("/api/voice/references", { token }),
    addReference: (token: string, name: string, handle?: string) =>
      request<{ voice: ReferenceVoice }>("/api/voice/references", { method: "POST", token, body: { name, handle } }),
    getBlends: (token: string) =>
      request<{ blends: SavedBlend[] }>("/api/voice/blends", { token }),
    createBlend: (token: string, name: string, voices: BlendVoiceInput[]) =>
      request<{ blend: SavedBlend }>("/api/voice/blends", { method: "POST", token, body: { name, voices } }),
    calibrate: (token: string, handle: string) =>
      request<{ profile: VoiceProfile; calibration: CalibrationResult }>("/api/voice/calibrate", {
        method: "POST", token, body: { handle },
      }),
  },

  drafts: {
    list: (token: string, status?: string) =>
      request<{ drafts: TweetDraft[] }>(`/api/drafts${status ? `?status=${status}` : ""}`, { token }),
    get: (token: string, id: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}`, { token }),
    create: (token: string, content: string, sourceType?: string, sourceContent?: string) =>
      request<{ draft: TweetDraft }>("/api/drafts", { method: "POST", token, body: { content, sourceType, sourceContent } }),
    generate: (token: string, sourceContent: string, sourceType: string, blendId?: string) =>
      request<{ draft: TweetDraft }>("/api/drafts/generate", {
        method: "POST", token, body: { sourceContent, sourceType, blendId },
      }),
    regenerate: (token: string, draftId: string, feedback?: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${draftId}/regenerate`, {
        method: "POST", token, body: { feedback },
      }),
    update: (token: string, id: string, data: { content?: string; status?: string; feedback?: string }) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}`, { method: "PATCH", token, body: data }),
    delete: (token: string, id: string) =>
      request<{ success: boolean }>(`/api/drafts/${id}`, { method: "DELETE", token }),
    team: (token: string, limit = 50) =>
      request<{ drafts: TeamDraft[]; total: number }>(`/api/drafts/team?limit=${limit}`, { token }),
  },

  analytics: {
    summary: (token: string) =>
      request<{ summary: AnalyticsSummary }>("/api/analytics/summary", { token }),
    learningLog: (token: string) =>
      request<{ entries: LearningLogEntry[] }>("/api/analytics/learning-log", { token }),
    engagement: (token: string) =>
      request<{ events: AnalyticsEvent[] }>("/api/analytics/engagement", { token }),
    engagementDaily: (token: string) =>
      request<{ days: DailyEngagement[] }>("/api/analytics/engagement-daily", { token }),
    activityDaily: (token: string) =>
      request<{ days: DailyActivity[] }>("/api/analytics/activity-daily", { token }),
    teamEngagementDaily: (token: string) =>
      request<{ days: DailyTeamEngagement[] }>("/api/analytics/team-engagement-daily", { token }),
    team: (token: string) =>
      request<{ analysts: TeamAnalyst[] }>("/api/analytics/team", { token }),
    daysToPeak: (token: string) =>
      request<{ peaks: AnalystPeak[] }>("/api/analytics/days-to-peak", { token }),
  },

  alerts: {
    feed: (token: string) =>
      request<{ alerts: Alert[] }>("/api/alerts/feed", { token }),
    subscriptions: (token: string) =>
      request<{ subscriptions: AlertSubscription[] }>("/api/alerts/subscriptions", { token }),
    subscribe: (token: string, type: string, value: string, delivery?: string[]) =>
      request<{ subscription: AlertSubscription }>("/api/alerts/subscriptions", { method: "POST", token, body: { type, value, delivery } }),
  },

  images: {
    generate: (token: string, prompt: string, style?: string) =>
      request<{ image: GeneratedImage }>("/api/images/generate", { method: "POST", token, body: { prompt, style } }),
    generateForDraft: (token: string, draftId: string, style?: string) =>
      request<{ image: GeneratedImage }>("/api/images/generate-for-draft", { method: "POST", token, body: { draftId, style } }),
    forDraft: (token: string, draftId: string) =>
      request<{ images: GeneratedImage[] }>(`/api/images/for-draft/${draftId}`, { token }),
  },

  trending: {
    scan: (token: string) =>
      request<{ alerts: Alert[] }>("/api/trending/scan", { method: "POST", token }),
    topics: (token: string) =>
      request<{ topics: TrendingTopic[] }>("/api/trending/topics", { token }),
  },

  research: {
    conduct: (token: string, query: string) =>
      request<{ result: ResearchResultData }>("/api/research", { method: "POST", token, body: { query } }),
    history: (token: string) =>
      request<{ results: ResearchResultData[] }>("/api/research/history", { token }),
  },

  users: {
    profile: (token: string) =>
      request<{ user: User }>("/api/users/profile", { token }),
    updateProfile: (token: string, data: { displayName?: string; email?: string }) =>
      request<{ user: User }>("/api/users/profile", { method: "PATCH", token, body: data }),
    team: (token: string) =>
      request<{ team: TeamMember[] }>("/api/users/team", { token }),
    pushTopProfiles: (token: string) =>
      request<{ message: string; affected: number }>("/api/users/push-top-profiles", { method: "POST", token }),
    sendNudge: (token: string) =>
      request<{ message: string; affected: number }>("/api/users/send-nudge", { method: "POST", token }),
    pushStyle: (token: string, blendId?: string) =>
      request<{ message: string; affected: number }>("/api/users/push-style", { method: "POST", token, body: { blendId } }),
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

export interface AnalystPeak {
  name: string;
  days: number;
  hasDrafts: boolean;
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
