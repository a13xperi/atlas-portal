import * as Sentry from "@sentry/nextjs";
import { getDemoResponse } from "./demo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

interface GenerateDraftInput {
  sourceContent: string;
  sourceType: string;
  blendId?: string;
  replyAngle?: string;
  angleInstruction?: string;
}

interface BriefingPreferenceInput {
  deliveryTime: string;
  topics: string[];
  sources: string[];
  channel: string;
}

export type QueuePlatform = "twitter";
export type QueueStatus = "queued" | "scheduled" | "published" | "failed";

export interface QueueItem {
  id: string;
  content: string;
  platform: QueuePlatform;
  status: QueueStatus;
  scheduledAt: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  failureReason?: string | null;
}

export interface QueueListResponse {
  items: QueueItem[];
  total: number;
}

export interface QueueCreateInput {
  content: string;
  platform?: QueuePlatform;
  scheduledAt?: string | null;
}

export interface QueueUpdateInput {
  content?: string;
  scheduledAt?: string | null;
  status?: QueueStatus;
  failureReason?: string | null;
}

export interface QaTestRun {
  id: string;
  project: string;
  tester_id: string;
  tester_name: string;
  tester_initials: string;
  created_at: string;
  updated_at: string;
  results: Record<string, { status: string; note: string; tester: string; timestamp: string }>;
  summary: { pass: number; fail: number; skip: number; total: number };
  status: 'in_progress' | 'completed' | 'abandoned';
  git_sha?: string | null;
  pr_number?: number | null;
  deploy_url?: string | null;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers7d: number;
  draftsCreated30d: number;
  draftsPosted30d: number;
  imagesGenerated30d: number;
  avgActualEngagement30d: number | null;
  avgPredictedEngagement30d: number | null;
}

export interface AdminRosterUser {
  id: string;
  handle: string;
  displayName: string | null;
  role: string;
  onboardingTrack: string | null;
  tourCompleted: boolean;
  createdAt: string;
  xHandle: string | null;
  voiceMaturity: string | null;
  tweetsAnalyzed: number;
  totalDrafts: number;
  totalPosts: number;
  events30d: number;
  lastSeen: string | null;
}

export interface AdminPipeline {
  funnel: Record<string, number>;
  sourceTypes: Record<string, number>;
}

export interface AdminAdoption {
  totalUsers: number;
  voiceCalibrated: number;
  researchUsed30d: number;
  alertsConfigured: number;
  briefingsGenerated30d: number;
  campaignsCreated: number;
  imagesGenerated30d: number;
}

export interface AdminDailyActivity {
  date: string;
  created: number;
  posted: number;
}

export interface AdminFeedEvent {
  id: string;
  type: string;
  createdAt: string;
  handle: string;
  displayName: string | null;
  metadata: Record<string, unknown> | null;
}

export type PromptCategory = "generation" | "calibration" | "oracle" | "analysis";

export interface PromptVariable {
  name: string;
  description: string;
  example: string;
}

export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: PromptVariable[];
  model: string;
  category: PromptCategory;
}

export interface PromptTestResult {
  output: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface AdminLeaderboardEntry {
  userId: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  breakdown: {
    output: number;
    postRate: number;
    engagementDelta: number;
    voiceMaturity: number;
    feedback: number;
    streak: number;
  };
}

export type ArenaPeriod = "last_7_days" | "last_30_days" | "all_time";

export interface ArenaLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  tweetsPublished: number;
  totalEngagement: number;
  consistencyStreak: number;
  badge: string | null;
}

export interface ArenaLeaderboardData {
  period: ArenaPeriod;
  entries: ArenaLeaderboardEntry[];
}

export interface ArenaMeEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  tweetsPublished: number;
  totalEngagement: number;
  consistencyStreak: number;
  badge: string | null;
}

export interface FeatureFlagRecord {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutRole: string | null;
  updatedAt: string;
}

export type OnboardingTrack = "TRACK_A" | "TRACK_B";


export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function* readSSEStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed.delta === "string") {
            yield parsed.delta;
          }
        } catch {
          // ignore malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

interface RawTwitterFollow {
  id: string;
  handle?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  follower_count?: number | null;
}

function mapTwitterFollow(follow: RawTwitterFollow): TwitterFollow {
  return {
    id: follow.id,
    handle: follow.handle ?? "",
    displayName: follow.display_name ?? follow.handle ?? "Unknown",
    bio: follow.bio ?? null,
    avatarUrl: follow.avatar_url ?? null,
    followerCount: follow.follower_count ?? 0,
  };
}

// Demo mode flag — when true, GET requests return mock data
const DEMO_KEY = "atlas_demo_mode";
let _demoMode: boolean = typeof window !== "undefined" ? sessionStorage.getItem(DEMO_KEY) === "true" : false;

export function setDemoMode(on: boolean) {
  _demoMode = on;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(DEMO_KEY, String(on));
  }
}

// Token store — fallback when HttpOnly cookies don't reach cross-origin
// Uses localStorage so the token persists across tabs and page refreshes
const TOKEN_KEY = "atlas_access_token";
let _accessToken: string | null = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }
}
export function getAccessToken() { return _accessToken; }

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = opts;

  // Demo mode interception — return mock data for GET requests
  if (_demoMode) {
    const demoResponse = getDemoResponse(path, method, body);
    if (demoResponse !== null) return demoResponse as T;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const signal = opts.signal ?? AbortSignal.timeout(45_000);

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
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
        const json = await res.json();
        // Auto-unwrap response envelope ({ ok, data, timestamp }) if present
        if (json && typeof json === "object" && "ok" in json && "data" in json) {
          return json.data as T;
        }
        // The analytics backend still returns a raw array for this legacy endpoint.
        if (path === "/api/analytics/engagement-daily" && Array.isArray(json)) {
          return { days: json } as T;
        }
        return json as T;
      }
    } catch (e) {
      if (e instanceof ApiError && !RETRYABLE_STATUSES.has(e.statusCode)) throw e;
      if (attempt === MAX_RETRIES - 1) throw e;
      // Network errors and retryable status codes fall through to retry
    }

    await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)));
  }

  throw new Error("Request failed after retries");
}

// Auth — all requests use HttpOnly cookies (credentials: 'include')
export const api = {
  auth: {
    register: (handle: string, email: string, password: string, onboardingTrack?: OnboardingTrack) =>
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
    x: {
      authorize: () =>
        request<{ url: string }>("/api/auth/x/authorize", { method: "POST" }),
      callback: (code: string, state: string) =>
        request<{ xHandle?: string }>("/api/auth/x/callback", {
          method: "POST",
          body: { code, state },
        }),
      status: () =>
        request<{ linked: boolean; tokenExpired?: boolean; xHandle?: string }>(
          "/api/auth/x/status"
        ),
    },
  },

  voice: {
    getProfile: () =>
      request<{ profile: VoiceProfile }>("/api/voice/profile"),
    updateProfile: (data: Partial<VoiceProfile>) =>
      request<{ profile: VoiceProfile }>("/api/voice/profile", { method: "PATCH", body: data }),
    getReferenceAccounts: () =>
      request<{ accounts: ReferenceAccount[] }>("/api/voice/reference-accounts"),
    getReferences: () =>
      request<{ voices: ReferenceVoice[] }>("/api/voice/references"),
    addReference: (name: string, handle?: string, avatarUrl?: string) =>
      request<{ voice: ReferenceVoice }>("/api/voice/references", { method: "POST", body: { name, handle, avatarUrl } }),
    getBlends: () =>
      request<{ blends: SavedBlend[] }>("/api/voice/blends"),
    createBlend: (name: string, voices: BlendVoiceInput[]) =>
      request<{ blend: SavedBlend }>("/api/voice/blends", { method: "POST", body: { name, voices } }),
    getBlendedProfile: () =>
      request<{ profile: BlendedVoiceProfile }>("/api/voice/blended-profile"),
    blend: (
      primaryId: string,
      additionalIds: string[],
      weights?: Record<string, number>
    ) =>
      request<VoiceBlendResponse>("/api/voice/blend", {
        method: "POST",
        body: {
          primary_id: primaryId,
          additional_ids: additionalIds,
          ...(weights ? { weights } : {}),
        },
      }),
    updateBlendVoice: (
      blendId: string,
      voiceId: string,
      data: { label?: string; percentage?: number; referenceVoiceId?: string | null }
    ) =>
      request<{ voice: BlendVoice }>(
        `/api/voice/blends/${blendId}/voices/${voiceId}`,
        { method: "PATCH", body: data }
      ),
    deleteBlendVoice: (blendId: string, voiceId: string) =>
      request<{ success: boolean }>(
        `/api/voice/blends/${blendId}/voices/${voiceId}`,
        { method: "DELETE" }
      ),
    calibrate: (handle: string, options?: { signal?: AbortSignal }) =>
      request<{ profile: VoiceProfile; calibration: CalibrationResult }>("/api/voice/calibrate", {
        method: "POST", body: { handle }, signal: options?.signal ?? AbortSignal.timeout(45_000),
      }),
    getGlobalReferenceAccounts: () =>
      request<{ accounts: (ReferenceVoice & { avatarUrl?: string })[] }>("/api/voice/reference-accounts"),
  },

  referenceAccounts: {
    getAll: () =>
      request<{ accounts: ReferenceAccount[] }>("/api/voice/reference-accounts"),
    getReferenceAccounts: () =>
      request<{ accounts: ReferenceAccount[] }>("/api/voice/reference-accounts"),
    saveSelections: (
      userId: string,
      ids: string[],
      weights?: Record<string, number>
    ) =>
      request<{ success: boolean; ids: string[] }>(
        `/api/users/${userId}/reference-accounts`,
        {
          method: "POST",
          body: { ids, weights },
        }
      ),
  },

  drafts: {
    list: (status?: string) =>
      request<{ drafts: TweetDraft[] }>(`/api/drafts${status ? `?status=${status}` : ""}`),
    get: (id: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}`),
    create: (content: string, sourceType?: string, sourceContent?: string) =>
      request<{ draft: TweetDraft }>("/api/drafts", { method: "POST", body: { content, sourceType, sourceContent } }),
    generate: (
      sourceContentOrInput: string | GenerateDraftInput,
      sourceType?: string,
      blendId?: string
    ) => {
      const payload =
        typeof sourceContentOrInput === "string"
          ? {
              sourceContent: sourceContentOrInput,
              sourceType: sourceType || "MANUAL",
              blendId,
            }
          : sourceContentOrInput;

      return request<{ draft: TweetDraft; blendWarning?: string }>("/api/drafts/generate", {
        method: "POST",
        body: payload,
      });
    },
    regenerate: (draftId: string, feedback?: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${draftId}/regenerate`, {
        method: "POST", body: { feedback },
      }),
    update: (
      id: string,
      data: {
        content?: string;
        status?: string;
        feedback?: string;
        actualEngagement?: number;
        scheduledAt?: string | null;
      }
    ) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}`, { method: "PATCH", body: data }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/drafts/${id}`, { method: "DELETE" }),
    refine: (draftId: string, instruction: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${draftId}/refine`, { method: "POST", body: { instruction } }),
    postToX: (draftId: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${draftId}/post`, {
        method: "POST",
      }),
    thread: (draftId: string) =>
      request<{ thread: string[]; count: number }>(`/api/drafts/${draftId}/thread`, { method: "POST" }),
    recordEngagement: (id: string, data: { likes: number; retweets: number; impressions: number }) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}/engagement`, { method: "POST", body: data }),
    fetchMetrics: (id: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}/fetch-metrics`, { method: "POST" }),
    performance: (id: string) =>
      request<{ performance: DraftPerformance }>(`/api/drafts/${id}/performance`),
    team: (limit = 50) =>
      request<{ drafts: TeamDraft[]; total: number }>(`/api/drafts/team?limit=${limit}`),
    queue: () =>
      request<{ queue: QueuedDraft[]; total: number; nextUp: QueuedDraft | null }>("/api/drafts/queue"),
    enqueue: (id: string) =>
      request<{ draft: TweetDraft }>(`/api/drafts/${id}/enqueue`, { method: "POST" }),
    schedule: (id: string, scheduledAt: string) =>
      request<{ draft: TweetDraft; conflicts?: { id: string; content: string; scheduledAt: string }[] }>(`/api/drafts/${id}/schedule`, { method: "POST", body: { scheduledAt } }),
    reorderQueue: (orderedIds: string[]) =>
      request<{ reordered: number }>("/api/drafts/queue/reorder", { method: "PATCH", body: { orderedIds } }),
    resetQueueOrder: () =>
      request<{ reset: boolean }>("/api/drafts/queue/reset-order", { method: "POST" }),
    batchFromContent: (content: string, sourceType: string, options?: { sourceUrl?: string; createCampaign?: boolean; campaignTitle?: string }) =>
      request<{ insights: any[]; drafts: any[]; campaign?: { id: string; title: string } }>("/api/drafts/batch-from-content", {
        method: "POST",
        body: { content, sourceType, ...options },
      }),
  },

  arena: {
    leaderboard: (period: ArenaPeriod = "last_30_days") =>
      request<ArenaLeaderboardData>(`/api/arena/leaderboard?period=${period}`),
    me: (period: ArenaPeriod = "last_30_days") =>
      request<ArenaMeEntry>(`/api/arena/me?period=${period}`),
  },

  queue: {
    list: (status?: QueueStatus) =>
      request<QueueListResponse | QueueItem[]>(
        `/api/queue${status ? `?status=${status}` : ""}`
      ),
    create: (data: QueueCreateInput) =>
      request<{ item: QueueItem } | QueueItem>("/api/queue", {
        method: "POST",
        body: data,
      }),
    update: (id: string, data: QueueUpdateInput) =>
      request<{ item: QueueItem } | QueueItem>(`/api/queue/${id}`, {
        method: "PATCH",
        body: data,
      }),
    remove: (id: string) =>
      request<{ success: boolean }>(`/api/queue/${id}`, {
        method: "DELETE",
      }),
    publish: (id: string) =>
      request<{ item: QueueItem } | QueueItem>(`/api/queue/${id}/publish`, {
        method: "POST",
      }),
    smartRank: (drafts: TweetDraft[]) =>
      request<{ drafts: Array<TweetDraft & { optimalTime: string; optimalTimeBadge?: string; topicScore: number; timeScore: number; historyScore: number }> }>("/api/queue/smart-rank", {
        method: "POST",
        body: { drafts },
      }),
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
    feed: (category?: "SIGNAL" | "NOTIFICATION") =>
      request<{ alerts: Alert[] }>(`/api/alerts/feed${category ? `?category=${category}` : ""}`),
    notifications: () =>
      request<{ alerts: Alert[] }>("/api/alerts/feed?category=NOTIFICATION"),
    dismiss: (id: string) =>
      request<{ alert: Alert }>(`/api/alerts/${id}`, { method: "PATCH", body: { dismissed: true } }),
    subscriptions: () =>
      request<{ subscriptions: AlertSubscription[] }>("/api/alerts/subscriptions"),
    subscribe: (type: string, value: string, delivery?: string[]) =>
      request<{ subscription: AlertSubscription }>("/api/alerts/subscriptions", { method: "POST", body: { type, value, delivery } }),
    toggleSubscription: (id: string) =>
      request<{ subscription: AlertSubscription }>(`/api/alerts/subscriptions/${id}`, { method: "PATCH" }),
    deleteSubscription: (id: string) =>
      request<{ success: boolean }>(`/api/alerts/subscriptions/${id}`, { method: "DELETE" }),
  },

  briefing: {
    getPreferences: () =>
      request<{ preference: BriefingPreference | null }>("/api/briefing/preferences"),
    updatePreferences: (data: BriefingPreferenceInput) =>
      request<{ preference: BriefingPreference }>("/api/briefing/preferences", {
        method: "PUT",
        body: data,
      }),
    history: () =>
      request<{ briefings: Briefing[] }>("/api/briefing/history"),
    generate: (briefType?: string) =>
      request<{ briefing: Briefing }>("/api/briefing/generate", { method: "POST", body: { briefType } }),
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
    updateProfile: (data: { displayName?: string; email?: string; bio?: string; avatarUrl?: string; tourCompleted?: boolean; tourStep?: number; onboardingTrack?: OnboardingTrack | null }) =>
      request<{ user: User }>("/api/users/profile", { method: "PATCH", body: data }),
    team: () =>
      request<{ team: TeamMember[] }>("/api/users/team"),
    pushTopProfiles: () =>
      request<{ message: string; affected: number }>("/api/users/push-top-profiles", { method: "POST" }),
    sendNudge: () =>
      request<{ message: string; affected: number }>("/api/users/send-nudge", { method: "POST" }),
    pushStyle: (blendId?: string) =>
      request<{ message: string; affected: number }>("/api/users/push-style", { method: "POST", body: { blendId } }),
    updateRole: (userId: string, role: string) =>
      request<{ user: { id: string; role: string } }>(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: { role },
      }),
  },

  qa: {
    listRuns: () =>
      request<{ runs: QaTestRun[] }>('/api/qa/runs'),
    getRun: (id: string) =>
      request<{ run: QaTestRun }>(`/api/qa/runs/${id}`),
    createRun: (data: { tester_name: string; tester_initials: string; git_sha?: string; pr_number?: number; deploy_url?: string }) =>
      request<{ run: QaTestRun }>('/api/qa/runs', { method: 'POST', body: data }),
    updateRun: (id: string, data: { results?: Record<string, unknown>; summary?: Record<string, unknown>; status?: string }) =>
      request<{ run: QaTestRun }>(`/api/qa/runs/${id}`, { method: 'PATCH', body: data }),
    deleteRun: (id: string) =>
      request<{ success: boolean }>(`/api/qa/runs/${id}`, { method: 'DELETE' }),
  },

  oracle: {
    message: (body: {
      track: "a" | "b";
      step: string;
      action: string;
      context?: {
        dimensions?: Record<string, number>;
        selectedRefs?: string[];
        blendRatio?: number;
        blendVoices?: Array<{ label: string; percentage: number }>;
        topics?: string[];
        calibrationResult?: { analysis: string; tweetsAnalyzed: number };
        handle?: string;
        freeText?: string;
      };
    }) =>
      request<{
        messages: Array<{ content: string; role: "oracle" }>;
        llmGenerated: boolean;
      }>("/api/oracle/message", { method: "POST", body }),

    chat: (body: {
      messages: Array<{ role: "user" | "oracle"; content: string }>;
      page?: string;
    }) =>
      request<{ text: string }>("/api/oracle/chat", { method: "POST", body }),

    /**
     * Streaming variant of `chat`. Returns the raw fetch Response body
     * (a ReadableStream) for SSE consumption. Use with `readSSEStream`.
     */
    chatStream: async (body: {
      messages: Array<{ role: "user" | "oracle"; content: string }>;
      page?: string;
    }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      };
      if (_accessToken) {
        headers["Authorization"] = `Bearer ${_accessToken}`;
      }
      const res = await fetch(`${API_URL}/api/oracle/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(err.error || "Stream request failed", res.status);
      }
      if (!res.body) {
        throw new ApiError("Response body is null", 500);
      }
      return res.body;
    },

    /**
     * OpenClaw-routed Oracle chat — returns the raw LLM reply with model
     * and token metadata. Profiles (smart/fast) are picked server-side from
     * the optional `phase` hint.
     */
    chatLLM: (body: {
      message: string;
      userId?: string;
      context?: Record<string, unknown>;
      phase?: string;
    }) =>
      request<{ reply: string; model: string; tokens: number }>(
        "/api/oracle/chat",
        { method: "POST", body },
      ),

    agent: (body: {
      messages: Array<{ role: "user" | "oracle"; content: string }>;
      page?: string;
      sessionId?: string;
      actionResults?: Array<{
        actionId: string;
        type: string;
        success: boolean;
        data?: unknown;
        error?: string;
      }>;
    }) =>
      request<{
        text: string;
        actions: Array<{
          id: string;
          type: string;
          input: Record<string, unknown>;
          requiresConfirmation: boolean;
          label: string;
        }>;
        serverResults?: Array<{ toolCallId: string; result: unknown }>;
      }>("/api/oracle/agent", { method: "POST", body }),

    /**
     * Load the authenticated user's persistent Oracle session.
     * Returns the last DB-persisted session (if any) plus recent messages.
     * Used by the floating widget to hydrate conversation history on mount.
     */
    getSession: () =>
      request<{
        sessionId: string;
        messages: Array<{
          role: "user" | "assistant";
          content: string;
          timestamp: string;
        }>;
        context: Record<string, unknown> | null;
      }>("/api/oracle/session"),

    clearSession: () =>
      request<{
        sessionId: string;
        messages: Array<{
          role: "user" | "assistant";
          content: string;
          timestamp: string;
        }>;
      }>("/api/oracle/session", { method: "DELETE" }),
  },

  admin: {
    overview: () => request<AdminOverview>("/api/admin/overview"),
    roster: () => request<{ users: AdminRosterUser[] }>("/api/admin/roster"),
    pipeline: () => request<AdminPipeline>("/api/admin/pipeline"),
    adoption: () => request<AdminAdoption>("/api/admin/adoption"),
    activityDaily: () => request<{ days: AdminDailyActivity[] }>("/api/admin/activity-daily"),
    feed: () => request<{ events: AdminFeedEvent[] }>("/api/admin/feed"),
    leaderboard: () =>
      request<{ entries: AdminLeaderboardEntry[] }>("/api/analytics/leaderboard"),
    getPrompts: () =>
      request<{ prompts: PromptConfig[] }>("/api/admin/prompts"),
    testPrompt: (promptId: string, variables: Record<string, string>) =>
      request<PromptTestResult>("/api/admin/prompts/test", {
        method: "POST",
        body: { promptId, variables },
      }),
  },

  twitter: {
    follows: async () => {
      const response = await request<{
        follows: RawTwitterFollow[];
        cached: boolean;
      }>("/api/twitter/follows");

      return {
        cached: response.cached,
        follows: response.follows.map(mapTwitterFollow),
      };
    },
    likes: () => request<{ likes: TwitterLike[]; cached: boolean }>("/api/twitter/likes"),
  },


  featureFlags: {
    list: () => request<{ flags: FeatureFlagRecord[] }>("/api/admin/feature-flags"),
    update: (key: string, body: { enabled?: boolean; rolloutRole?: string | null }) =>
      request<{ flag: FeatureFlagRecord }>(`/api/admin/feature-flags/${key}`, {
        method: "PATCH",
        body,
      }),
    public: () => request<{ flags: string[] }>("/api/admin/feature-flags/public"),
  },

  campaigns: {
    list: () =>
      request<{ campaigns: Campaign[] }>("/api/campaigns"),
    create: (name: string, description?: string) =>
      request<{ campaign: Campaign }>("/api/campaigns", { method: "POST", body: { name, description } }),
    get: (id: string) =>
      request<{ campaign: Campaign }>(`/api/campaigns/${id}`),
    analytics: (id: string) =>
      request<CampaignAnalytics>(`/api/campaigns/${id}/analytics`),
    update: (id: string, data: { name?: string; description?: string | null; status?: Campaign["status"] }) =>
      request<{ campaign: Campaign }>(`/api/campaigns/${id}`, { method: "PATCH", body: data }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/campaigns/${id}`, { method: "DELETE" }),
    clone: (id: string) =>
      request<{ campaign: Campaign }>(`/api/campaigns/${id}/clone`, { method: "POST" }),
    addDraft: (campaignId: string, draftId: string, sortOrder?: number) =>
      request<{ success: boolean }>(`/api/campaigns/${campaignId}/drafts`, { method: "POST", body: { draftId, sortOrder } }),
    removeDraft: (campaignId: string, draftId: string) =>
      request<{ success: boolean }>(`/api/campaigns/${campaignId}/drafts/${draftId}`, { method: "DELETE" }),
    generateFromPdf: async (
      file: File,
      options?: { angles?: number; tone?: string; name?: string; description?: string },
    ): Promise<{
      campaignId: string;
      filename: string;
      mimeType: string;
      wordCount: number;
      truncated: boolean;
      drafts: Array<{ id: string; content: string; angle: string; score: number }>;
    }> => {
      const form = new FormData();
      form.append("file", file);
      if (options?.angles) form.append("angles", String(options.angles));
      if (options?.tone) form.append("tone", options.tone);
      if (options?.name) form.append("name", options.name);
      if (options?.description) form.append("description", options.description);
      const headers: Record<string, string> = {};
      if (_accessToken) headers["Authorization"] = `Bearer ${_accessToken}`;
      const res = await fetch(`${API_URL}/api/campaigns/generate-from-pdf`, {
        method: "POST",
        headers,
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(err.error || "Generate-from-PDF failed", res.status);
      }
      const json = await res.json();
      return json && typeof json === "object" && "data" in json ? (json as { data: typeof json }).data as any : json;
    },
    postAll: (id: string) =>
      request<{ posted: number }>(`/api/campaigns/${id}/post-all`, { method: "POST" }),
  },

  bugs: {
    list: (status?: string) =>
      request<{ bugs: BugRecord[] }>(`/api/bugs${status ? `?status=${status}` : ""}`),
    get: (id: string) =>
      request<{ bug: BugRecord }>(`/api/bugs/${id}`),
    create: (data: BugCreateInput) =>
      request<{ bug: BugRecord }>("/api/bugs", { method: "POST", body: data }),
    update: (id: string, data: BugUpdateInput) =>
      request<{ bug: BugRecord }>(`/api/bugs/${id}`, { method: "PATCH", body: data }),
    delete: (id: string) =>
      request<{ bug: BugRecord }>(`/api/bugs/${id}`, { method: "DELETE" }),
  },
};

// Types
export interface User {
  id: string;
  handle: string;
  role: "ANALYST" | "MANAGER" | "ADMIN";
  onboardingTrack?: OnboardingTrack | null;
  displayName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string | null;
  telegramChatId?: string | null;
}

export interface VoiceProfile {
  id: string;
  userId: string;
  humor: number;
  formality: number;
  brevity: number;
  contrarianTone: number;
  directness?: number;
  warmth?: number;
  technicalDepth?: number;
  confidence?: number;
  evidenceOrientation?: number;
  solutionOrientation?: number;
  socialPosture?: number;
  selfPromotionalIntensity?: number;
  maturity: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  tweetsAnalyzed: number;
  analysis?: string | null;
}

export interface CalibrationResult {
  confidence: number;
  analysis: string;
  tweetsAnalyzed: number;
  source?: { mode: string; pool: number; topN: number; recentN: number };
  twitterUser: { username: string; name: string };
}

export interface ReferenceVoice {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  isActive: boolean;
  voiceProfile?: VoiceProfile;
}

export interface ReferenceAccount {
  id: string;
  handle?: string;
  displayName?: string;
  category?: string;
  profileImageUrl?: string | null;
  name?: string;
  avatarUrl?: string | null;
}

export interface TwitterFollow {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  followerCount: number;
}

export interface TwitterLike {
  id: string;
  text: string;
  author_handle: string | null;
  author_avatar: string | null;
  created_at: string | null;
  like_count: number;
  retweet_count: number;
}


export interface BlendVoice {
  id: string;
  blendId?: string;
  label: string;
  percentage: number;
  referenceVoiceId?: string | null;
  referenceVoice?: ReferenceVoice | null;
}

export interface SavedBlend {
  id: string;
  name: string;
  voices: BlendVoice[];
}

export interface BlendedVoiceDimensions {
  humor: number;
  formality: number;
  brevity: number;
  contrarianTone: number;
  directness: number;
  warmth: number;
  technicalDepth: number;
  confidence: number;
  evidenceOrientation: number;
  solutionOrientation: number;
  socialPosture: number;
  selfPromotionalIntensity: number;
}

export interface BlendedVoiceProfile {
  id: string;
  primaryTwitterId: string;
  primaryHandle: string | null;
  additionalTwitterIds: string[];
  additionalHandles: string[];
  weights: Record<string, number>;
  dimensions: BlendedVoiceDimensions;
  styleSignals?: Record<string, unknown> | null;
  tweetsAnalyzed: number;
  blendSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlendedVoiceInspiration {
  twitterId: string;
  handle: string;
  name: string;
  tweetCount: number;
  weight: number;
}

export interface VoiceBlendResponse {
  blendedProfile: {
    id: string;
    primaryTwitterId: string;
    additionalTwitterIds: string[];
    weights: Record<string, number>;
    tweetsAnalyzed: number;
    blendSummary?: string | null;
  };
  inspirations: BlendedVoiceInspiration[];
  dimensions: BlendedVoiceDimensions;
  styleSignals?: Record<string, unknown> | null;
  summary: string;
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
  status: "DRAFT" | "APPROVED" | "SCHEDULED" | "POSTED" | "ARCHIVED";
  confidence?: number;
  predictedEngagement?: number;
  actualEngagement?: number;
  sourceType?: string;
  sourceContent?: string;
  blendId?: string;
  feedback?: string;
  scheduledAt?: string | null;
  postedAt?: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  draftCount: number;
  drafts?: TweetDraft[];
  createdAt: string;
}

export interface CampaignTweetAnalytics {
  draftId: string;
  content: string;
  postedAt: string | null;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
}

export interface CampaignAnalytics {
  tweets: CampaignTweetAnalytics[];
  totals: {
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
  };
  daily: {
    date: string;
    dayLabel: string;
    engagement: number;
  }[];
}

export interface QueuedDraft extends TweetDraft {
  _score: number;
  suggestedAt: string;
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
  category?: "SIGNAL" | "NOTIFICATION";
  sourceUrl?: string;
  sentiment?: string;
  relevance?: number;
  createdAt: string;
}

export interface AlertSubscription {
  id: string;
  type: string;
  value: string;
  isActive: boolean;
  delivery: string[];
}

export interface BriefingPreference {
  deliveryTime: string;
  topics: string[];
  sources: string[];
  channel: string;
  deliveryChannel?: string;
}

export interface BriefingSection {
  heading: string;
  emoji: string;
  bullets: string[];
}

export interface Briefing {
  id: string;
  title: string;
  summary: string;
  sections: BriefingSection[];
  topics: string[];
  sources: string[];
  createdAt: string;
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

export interface DraftPerformance {
  predicted: number;
  actual: number;
  deltaPct: number;
  percentile: number;
  metrics: {
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
    bookmarks: number;
  };
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

export interface BugRecord {
  id: string;
  bug_number: number;
  title: string;
  description: string;
  page_route: string | null;
  page_url: string | null;
  severity: string;
  status: string;
  source: string | null;
  project: string | null;
  found_by: string | null;
  fixed_by: string | null;
  tags: string[];
  notes: string | null;
  fingerprint: string | null;
  occurrence_count: number;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  fixed_at: string | null;
}

export interface BugCreateInput {
  title: string;
  description: string;
  severity?: "critical" | "high" | "medium" | "low" | "cosmetic";
  page_route?: string | null;
  page_url?: string | null;
  source?: "manual" | "console" | "session";
  tags?: string[];
}

export interface BugUpdateInput {
  status?: "open" | "fixed" | "in-progress" | "closed" | "wontfix" | "archived";
  notes?: string | null;
  severity?: "critical" | "high" | "medium" | "low" | "cosmetic";
  title?: string;
  description?: string;
  fixed_by?: string | null;
  tags?: string[];
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
