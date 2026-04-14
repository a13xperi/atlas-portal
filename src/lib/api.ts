import * as Sentry from "@sentry/nextjs";
import { z, type ZodIssue, type ZodTypeAny } from "zod";
import { getDemoResponse } from "./demo-data";
import {
  activityDailyResponseSchema,
  analyticsEventsResponseSchema,
  analyticsSummaryResponseSchema,
  authLogoutResponseSchema,
  authMeResponseSchema,
  authRefreshResponseSchema,
  authSessionResponseSchema,
  blendVoiceResponseSchema,
  blendedVoiceProfileResponseSchema,
  briefingHistoryResponseSchema,
  briefingPreferenceResponseSchema,
  briefingResponseSchema,
  calibrationResponseSchema,
  daysToPeakResponseSchema,
  draftGenerateResponseSchema,
  draftResponseSchema,
  draftsResponseSchema,
  draftScheduleResponseSchema,
  draftThreadResponseSchema,
  engagementDailyResponseSchema,
  learningLogResponseSchema,
  messageAffectedResponseSchema,
  queuedDraftsResponseSchema,
  referenceAccountSelectionResponseSchema,
  referenceAccountsResponseSchema,
  referenceVoiceResponseSchema,
  referenceVoicesResponseSchema,
  reorderQueueResponseSchema,
  resetQueueOrderResponseSchema,
  savedBlendResponseSchema,
  savedBlendsResponseSchema,
  teamAnalyticsResponseSchema,
  teamDraftsResponseSchema,
  teamEngagementDailyResponseSchema,
  twitterFollowsResponseSchema,
  twitterLikesResponseSchema,
  userRoleResponseSchema,
  usersProfileResponseSchema,
  usersTeamResponseSchema,
  voiceBlendResponseSchema,
  voiceProfileResponseSchema,
  xAuthorizeResponseSchema,
  xCallbackResponseSchema,
  xStatusResponseSchema,
} from "./api-schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;

interface RequestOptions {
  method?: string;
  body?: unknown;
  schema?: ZodTypeAny;
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

export class ApiResponseValidationError extends ApiError {
  issues: ZodIssue[];
  responsePath: string;

  constructor(path: string, issues: ZodIssue[]) {
    const firstIssue = issues[0];
    const issuePath = firstIssue?.path.length ? firstIssue.path.join(".") : "response";
    super(`Invalid response from ${path}: ${issuePath} ${firstIssue?.message ?? "schema validation failed"}`, 422);
    this.name = "ApiResponseValidationError";
    this.issues = issues;
    this.responsePath = path;
  }
}

interface RawTwitterFollow {
  id: string;
  handle?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  follower_count?: number | null;
  followerCount?: number | null;
}

function mapTwitterFollow(follow: RawTwitterFollow): TwitterFollow {
  return {
    id: follow.id,
    handle: follow.handle ?? "",
    displayName: follow.display_name ?? follow.displayName ?? follow.handle ?? "Unknown",
    bio: follow.bio ?? null,
    avatarUrl: follow.avatar_url ?? follow.avatarUrl ?? null,
    followerCount: follow.follower_count ?? follow.followerCount ?? 0,
  };
}

const errorPayloadSchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();

function summarizePayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return { kind: "array", length: payload.length };
  }

  if (payload && typeof payload === "object") {
    return {
      kind: "object",
      keys: Object.keys(payload as Record<string, unknown>).slice(0, 20),
    };
  }

  return { kind: typeof payload };
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  const parsed = errorPayloadSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data.error ?? parsed.data.message ?? fallback;
  }

  return fallback;
}

function normalizeResponsePayload(path: string, payload: unknown) {
  if (payload && typeof payload === "object" && "ok" in payload && "data" in payload) {
    return (payload as { data: unknown }).data;
  }

  if (path === "/api/analytics/engagement-daily" && Array.isArray(payload)) {
    return { days: payload };
  }

  return payload;
}

function parseResponseWithSchema<TSchema extends ZodTypeAny>(
  path: string,
  payload: unknown,
  schema: TSchema,
): z.infer<TSchema> {
  const parsed = schema.safeParse(payload);

  if (parsed.success) {
    return parsed.data;
  }

  const error = new ApiResponseValidationError(path, parsed.error.issues);
  Sentry.captureException(error, {
    extra: {
      path,
      issues: parsed.error.issues,
      payloadSummary: summarizePayload(payload),
    },
  });
  throw error;
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

async function request<TSchema extends ZodTypeAny>(
  path: string,
  opts: RequestOptions & { schema: TSchema },
): Promise<z.infer<TSchema>>;
async function request<T>(path: string, opts?: RequestOptions): Promise<T>;
async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, schema } = opts;

  // Demo mode interception — return mock data for GET requests
  if (_demoMode) {
    const demoResponse = getDemoResponse(path, method, body);
    if (demoResponse !== null) {
      const normalizedDemoResponse = normalizeResponsePayload(path, demoResponse);
      return schema
        ? (parseResponseWithSchema(path, normalizedDemoResponse, schema) as T)
        : (normalizedDemoResponse as T);
    }
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
        const err = await res.json().catch(() => null);
        const message = extractErrorMessage(err, res.statusText || "Request failed");
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
        const normalizedPayload = normalizeResponsePayload(path, json);
        return schema
          ? (parseResponseWithSchema(path, normalizedPayload, schema) as T)
          : (normalizedPayload as T);
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
    register: (handle: string, email: string, password: string, onboardingTrack?: OnboardingTrack) =>
      request("/api/auth/register", {
        method: "POST",
        body: { handle, email, password, onboardingTrack },
        schema: authSessionResponseSchema,
      }),
    login: (email: string, password: string) =>
      request("/api/auth/login", {
        method: "POST",
        body: { email, password },
        schema: authSessionResponseSchema,
      }),
    refresh: () =>
      request("/api/auth/refresh", {
        method: "POST",
        schema: authRefreshResponseSchema,
      }),
    logout: () =>
      request("/api/auth/logout", {
        method: "POST",
        schema: authLogoutResponseSchema,
      }),
    me: () =>
      request("/api/auth/me", {
        schema: authMeResponseSchema,
      }),
    x: {
      authorize: () =>
        request("/api/auth/x/authorize", {
          method: "POST",
          schema: xAuthorizeResponseSchema,
        }),
      callback: (code: string, state: string) =>
        request("/api/auth/x/callback", {
          method: "POST",
          body: { code, state },
          schema: xCallbackResponseSchema,
        }),
      status: () =>
        request("/api/auth/x/status", {
          schema: xStatusResponseSchema,
        }),
    },
  },

  voice: {
    getProfile: () =>
      request("/api/voice/profile", {
        schema: voiceProfileResponseSchema,
      }),
    updateProfile: (data: Partial<VoiceProfile>) =>
      request("/api/voice/profile", {
        method: "PATCH",
        body: data,
        schema: voiceProfileResponseSchema,
      }),
    getReferenceAccounts: () =>
      request("/api/voice/reference-accounts", {
        schema: referenceAccountsResponseSchema,
      }),
    getReferences: () =>
      request("/api/voice/references", {
        schema: referenceVoicesResponseSchema,
      }),
    addReference: (name: string, handle?: string, avatarUrl?: string) =>
      request("/api/voice/references", {
        method: "POST",
        body: { name, handle, avatarUrl },
        schema: referenceVoiceResponseSchema,
      }),
    getBlends: () =>
      request("/api/voice/blends", {
        schema: savedBlendsResponseSchema,
      }),
    createBlend: (name: string, voices: BlendVoiceInput[]) =>
      request("/api/voice/blends", {
        method: "POST",
        body: { name, voices },
        schema: savedBlendResponseSchema,
      }),
    getBlendedProfile: () =>
      request("/api/voice/blended-profile", {
        schema: blendedVoiceProfileResponseSchema,
      }),
    blend: (
      primaryId: string,
      additionalIds: string[],
      weights?: Record<string, number>
    ) =>
      request("/api/voice/blend", {
        method: "POST",
        body: {
          primary_id: primaryId,
          additional_ids: additionalIds,
          ...(weights ? { weights } : {}),
        },
        schema: voiceBlendResponseSchema,
      }),
    updateBlendVoice: (
      blendId: string,
      voiceId: string,
      data: { label?: string; percentage?: number; referenceVoiceId?: string | null }
    ) =>
      request(`/api/voice/blends/${blendId}/voices/${voiceId}`, {
        method: "PATCH",
        body: data,
        schema: blendVoiceResponseSchema,
      }),
    deleteBlendVoice: (blendId: string, voiceId: string) =>
      request(`/api/voice/blends/${blendId}/voices/${voiceId}`, {
        method: "DELETE",
        schema: authLogoutResponseSchema,
      }),
    calibrate: (handle: string) =>
      request("/api/voice/calibrate", {
        method: "POST",
        body: { handle },
        schema: calibrationResponseSchema,
      }),
    getGlobalReferenceAccounts: () =>
      request("/api/voice/reference-accounts", {
        schema: referenceAccountsResponseSchema,
      }),
  },

  referenceAccounts: {
    getAll: () =>
      request("/api/voice/reference-accounts", {
        schema: referenceAccountsResponseSchema,
      }),
    getReferenceAccounts: () =>
      request("/api/voice/reference-accounts", {
        schema: referenceAccountsResponseSchema,
      }),
    saveSelections: (
      userId: string,
      ids: string[],
      weights?: Record<string, number>
    ) =>
      request(`/api/users/${userId}/reference-accounts`, {
        method: "POST",
        body: { ids, weights },
        schema: referenceAccountSelectionResponseSchema,
      }),
  },

  drafts: {
    list: (status?: string) =>
      request(`/api/drafts${status ? `?status=${status}` : ""}`, {
        schema: draftsResponseSchema,
      }),
    get: (id: string) =>
      request(`/api/drafts/${id}`, {
        schema: draftResponseSchema,
      }),
    create: (content: string, sourceType?: string, sourceContent?: string) =>
      request("/api/drafts", {
        method: "POST",
        body: { content, sourceType, sourceContent },
        schema: draftResponseSchema,
      }),
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

      return request("/api/drafts/generate", {
        method: "POST",
        body: payload,
        schema: draftGenerateResponseSchema,
      });
    },
    regenerate: (draftId: string, feedback?: string) =>
      request(`/api/drafts/${draftId}/regenerate`, {
        method: "POST",
        body: { feedback },
        schema: draftResponseSchema,
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
      request(`/api/drafts/${id}`, {
        method: "PATCH",
        body: data,
        schema: draftResponseSchema,
      }),
    delete: (id: string) =>
      request(`/api/drafts/${id}`, {
        method: "DELETE",
        schema: authLogoutResponseSchema,
      }),
    refine: (draftId: string, instruction: string) =>
      request(`/api/drafts/${draftId}/refine`, {
        method: "POST",
        body: { instruction },
        schema: draftResponseSchema,
      }),
    postToX: (draftId: string) =>
      request(`/api/drafts/${draftId}/post`, {
        method: "POST",
        schema: draftResponseSchema,
      }),
    thread: (draftId: string) =>
      request(`/api/drafts/${draftId}/thread`, {
        method: "POST",
        schema: draftThreadResponseSchema,
      }),
    recordEngagement: (id: string, data: { likes: number; retweets: number; impressions: number }) =>
      request(`/api/drafts/${id}/engagement`, {
        method: "POST",
        body: data,
        schema: draftResponseSchema,
      }),
    fetchMetrics: (id: string) =>
      request(`/api/drafts/${id}/fetch-metrics`, {
        method: "POST",
        schema: draftResponseSchema,
      }),
    team: (limit = 50) =>
      request(`/api/drafts/team?limit=${limit}`, {
        schema: teamDraftsResponseSchema,
      }),
    queue: () =>
      request("/api/drafts/queue", {
        schema: queuedDraftsResponseSchema,
      }),
    enqueue: (id: string) =>
      request(`/api/drafts/${id}/enqueue`, {
        method: "POST",
        schema: draftResponseSchema,
      }),
    schedule: (id: string, scheduledAt: string) =>
      request(`/api/drafts/${id}/schedule`, {
        method: "POST",
        body: { scheduledAt },
        schema: draftScheduleResponseSchema,
      }),
    reorderQueue: (orderedIds: string[]) =>
      request("/api/drafts/queue/reorder", {
        method: "PATCH",
        body: { orderedIds },
        schema: reorderQueueResponseSchema,
      }),
    resetQueueOrder: () =>
      request("/api/drafts/queue/reset-order", {
        method: "POST",
        schema: resetQueueOrderResponseSchema,
      }),
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
  },

  analytics: {
    summary: () =>
      request("/api/analytics/summary", {
        schema: analyticsSummaryResponseSchema,
      }),
    learningLog: () =>
      request("/api/analytics/learning-log", {
        schema: learningLogResponseSchema,
      }),
    engagement: () =>
      request("/api/analytics/engagement", {
        schema: analyticsEventsResponseSchema,
      }),
    engagementDaily: () =>
      request("/api/analytics/engagement-daily", {
        schema: engagementDailyResponseSchema,
      }),
    activityDaily: () =>
      request("/api/analytics/activity-daily", {
        schema: activityDailyResponseSchema,
      }),
    teamEngagementDaily: () =>
      request("/api/analytics/team-engagement-daily", {
        schema: teamEngagementDailyResponseSchema,
      }),
    team: () =>
      request("/api/analytics/team", {
        schema: teamAnalyticsResponseSchema,
      }),
    daysToPeak: () =>
      request("/api/analytics/days-to-peak", {
        schema: daysToPeakResponseSchema,
      }),
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
      request("/api/briefing/preferences", {
        schema: briefingPreferenceResponseSchema,
      }),
    updatePreferences: (data: BriefingPreferenceInput) =>
      request("/api/briefing/preferences", {
        method: "PUT",
        body: data,
        schema: briefingPreferenceResponseSchema,
      }),
    history: () =>
      request("/api/briefing/history", {
        schema: briefingHistoryResponseSchema,
      }),
    generate: (briefType?: string) =>
      request("/api/briefing/generate", {
        method: "POST",
        body: { briefType },
        schema: briefingResponseSchema,
      }),
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
      request("/api/users/profile", {
        schema: usersProfileResponseSchema,
      }),
    updateProfile: (data: { displayName?: string; email?: string; bio?: string; avatarUrl?: string; tourCompleted?: boolean; tourStep?: number; onboardingTrack?: OnboardingTrack | null }) =>
      request("/api/users/profile", {
        method: "PATCH",
        body: data,
        schema: usersProfileResponseSchema,
      }),
    team: () =>
      request("/api/users/team", {
        schema: usersTeamResponseSchema,
      }),
    pushTopProfiles: () =>
      request("/api/users/push-top-profiles", {
        method: "POST",
        schema: messageAffectedResponseSchema,
      }),
    sendNudge: () =>
      request("/api/users/send-nudge", {
        method: "POST",
        schema: messageAffectedResponseSchema,
      }),
    pushStyle: (blendId?: string) =>
      request("/api/users/push-style", {
        method: "POST",
        body: { blendId },
        schema: messageAffectedResponseSchema,
      }),
    updateRole: (userId: string, role: string) =>
      request(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: { role },
        schema: userRoleResponseSchema,
      }),
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
      const response = await request("/api/twitter/follows", {
        schema: twitterFollowsResponseSchema,
      });

      return {
        cached: response.cached,
        follows: response.follows.map(mapTwitterFollow),
      };
    },
    likes: () =>
      request("/api/twitter/likes", {
        schema: twitterLikesResponseSchema,
      }),
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
  onboardingTrack?: OnboardingTrack | null;
  displayName?: string | null;
  email?: string | null;
  bio?: string | null;
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
  twitterUser: { username: string; name: string };
}

export interface ReferenceVoice {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string | null;
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
  confidence?: number | null;
  predictedEngagement?: number | null;
  actualEngagement?: number | null;
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
  voiceProfile?: VoiceProfile | null;
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
  displayName?: string | null;
  role: string;
  voiceProfile?: VoiceProfile | null;
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
