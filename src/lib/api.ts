import * as Sentry from "@sentry/nextjs";
import { getDemoResponse } from "./demo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-production-9bef.up.railway.app";

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;

interface RequestOptions {
  method?: string;
  body?: unknown;
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

export interface FeatureFlagRecord {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutRole: string | null;
  updatedAt: string;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
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
        const json = await res.json();
        // Auto-unwrap response envelope ({ ok, data, timestamp }) if present
        if (json && typeof json === "object" && "ok" in json && "data" in json) {
          return json.data as T;
        }
        return json as T;
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
    x: {
      authorize: () =>
        request<{ url: string }>("/api/auth/x/authorize"),
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
    addReference: (name: string, handle?: string) =>
      request<{ voice: ReferenceVoice }>("/api/voice/references", { method: "POST", body: { name, handle } }),
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
    calibrate: (handle: string) =>
      request<{ profile: VoiceProfile; calibration: CalibrationResult }>("/api/voice/calibrate", {
        method: "POST", body: { handle },
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

      return request<{ draft: TweetDraft }>("/api/drafts/generate", {
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
    updateProfile: (data: { displayName?: string; email?: string; bio?: string; avatarUrl?: string; tourCompleted?: boolean; tourStep?: number }) =>
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

  qa: {
    listRuns: () =>
      request<{ runs: QaTestRun[] }>('/api/qa/runs'),
    getRun: (id: string) =>
      request<{ run: QaTestRun }>(`/api/qa/runs/${id}`),
    createRun: (data: { tester_name: string; tester_initials: string }) =>
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

    agent: (body: {
      messages: Array<{ role: "user" | "oracle"; content: string }>;
      page?: string;
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
  },

  admin: {
    overview: () => request<AdminOverview>("/api/admin/overview"),
    roster: () => request<{ users: AdminRosterUser[] }>("/api/admin/roster"),
    pipeline: () => request<AdminPipeline>("/api/admin/pipeline"),
    adoption: () => request<AdminAdoption>("/api/admin/adoption"),
    activityDaily: () => request<{ days: AdminDailyActivity[] }>("/api/admin/activity-daily"),
    feed: () => request<{ events: AdminFeedEvent[] }>("/api/admin/feed"),
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
    likes: () => request<any[]>("/api/twitter/likes"),
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
    update: (id: string, data: { name?: string; description?: string | null; status?: Campaign["status"] }) =>
      request<{ campaign: Campaign }>(`/api/campaigns/${id}`, { method: "PATCH", body: data }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/campaigns/${id}`, { method: "DELETE" }),
    addDraft: (campaignId: string, draftId: string, sortOrder?: number) =>
      request<{ success: boolean }>(`/api/campaigns/${campaignId}/drafts`, { method: "POST", body: { draftId, sortOrder } }),
    removeDraft: (campaignId: string, draftId: string) =>
      request<{ success: boolean }>(`/api/campaigns/${campaignId}/drafts/${draftId}`, { method: "DELETE" }),
  },
};

// Types
export interface User {
  id: string;
  handle: string;
  role: "ANALYST" | "MANAGER" | "ADMIN";
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
  avatarUrl?: string;
  isActive: boolean;
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
