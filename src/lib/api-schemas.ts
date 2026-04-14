import { z } from "zod";

const nullableString = z.string().nullable();
const optionalNullableString = nullableString.optional();
const optionalNullableNumber = z.number().nullable().optional();

export const voiceProfileSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    humor: z.number(),
    formality: z.number(),
    brevity: z.number(),
    contrarianTone: z.number(),
    directness: z.number().optional(),
    warmth: z.number().optional(),
    technicalDepth: z.number().optional(),
    confidence: z.number().optional(),
    evidenceOrientation: z.number().optional(),
    solutionOrientation: z.number().optional(),
    socialPosture: z.number().optional(),
    selfPromotionalIntensity: z.number().optional(),
    maturity: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    tweetsAnalyzed: z.number(),
    analysis: z.string().nullable().optional(),
  })
  .passthrough();

export const userSchema = z
  .object({
    id: z.string(),
    handle: z.string(),
    role: z.enum(["ANALYST", "MANAGER", "ADMIN"]),
    onboardingTrack: z.enum(["TRACK_A", "TRACK_B"]).nullable().optional(),
    displayName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    avatarUrl: optionalNullableString,
    telegramChatId: optionalNullableString,
  })
  .passthrough();

export const authSessionResponseSchema = z
  .object({
    user: userSchema,
    token: z.string(),
    refresh_token: z.string(),
  })
  .passthrough();

export const authRefreshResponseSchema = z
  .object({
    token: z.string(),
    refresh_token: z.string(),
  })
  .passthrough();

export const authLogoutResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .passthrough();

export const authMeResponseSchema = z
  .object({
    user: userSchema
      .extend({
        voiceProfile: voiceProfileSchema.nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const voiceProfileResponseSchema = z
  .object({
    profile: voiceProfileSchema,
  })
  .passthrough();

export const xAuthorizeResponseSchema = z
  .object({
    url: z.string(),
  })
  .passthrough();

export const xCallbackResponseSchema = z
  .object({
    xHandle: z.string().optional(),
  })
  .passthrough();

export const xStatusResponseSchema = z
  .object({
    linked: z.boolean(),
    tokenExpired: z.boolean().optional(),
    xHandle: z.string().optional(),
  })
  .passthrough();

export const referenceAccountSchema = z
  .object({
    id: z.string(),
    handle: z.string().optional(),
    displayName: z.string().optional(),
    category: z.string().optional(),
    profileImageUrl: optionalNullableString,
    name: z.string().optional(),
    avatarUrl: optionalNullableString,
  })
  .passthrough();

export const referenceAccountsResponseSchema = z
  .object({
    accounts: z.array(referenceAccountSchema),
  })
  .passthrough();

export const referenceVoiceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    handle: z.string().optional(),
    avatarUrl: optionalNullableString,
    isActive: z.boolean(),
  })
  .passthrough();

export const referenceVoicesResponseSchema = z
  .object({
    voices: z.array(referenceVoiceSchema),
  })
  .passthrough();

export const referenceVoiceResponseSchema = z
  .object({
    voice: referenceVoiceSchema,
  })
  .passthrough();

export const blendVoiceSchema = z
  .object({
    id: z.string(),
    blendId: z.string().optional(),
    label: z.string(),
    percentage: z.number(),
    referenceVoiceId: z.string().nullable().optional(),
    referenceVoice: referenceVoiceSchema.nullable().optional(),
  })
  .passthrough();

export const blendVoiceResponseSchema = z
  .object({
    voice: blendVoiceSchema,
  })
  .passthrough();

export const savedBlendSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    voices: z.array(blendVoiceSchema),
  })
  .passthrough();

export const savedBlendsResponseSchema = z
  .object({
    blends: z.array(savedBlendSchema),
  })
  .passthrough();

export const savedBlendResponseSchema = z
  .object({
    blend: savedBlendSchema,
  })
  .passthrough();

export const blendedVoiceDimensionsSchema = z
  .object({
    humor: z.number(),
    formality: z.number(),
    brevity: z.number(),
    contrarianTone: z.number(),
    directness: z.number(),
    warmth: z.number(),
    technicalDepth: z.number(),
    confidence: z.number(),
    evidenceOrientation: z.number(),
    solutionOrientation: z.number(),
    socialPosture: z.number(),
    selfPromotionalIntensity: z.number(),
  })
  .passthrough();

export const blendedVoiceProfileSchema = z
  .object({
    id: z.string(),
    primaryTwitterId: z.string(),
    primaryHandle: nullableString,
    additionalTwitterIds: z.array(z.string()),
    additionalHandles: z.array(z.string()),
    weights: z.record(z.string(), z.number()),
    dimensions: blendedVoiceDimensionsSchema,
    styleSignals: z.record(z.string(), z.unknown()).nullable().optional(),
    tweetsAnalyzed: z.number(),
    blendSummary: nullableString.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const blendedVoiceProfileResponseSchema = z
  .object({
    profile: blendedVoiceProfileSchema,
  })
  .passthrough();

export const blendedVoiceInspirationSchema = z
  .object({
    twitterId: z.string(),
    handle: z.string(),
    name: z.string(),
    tweetCount: z.number(),
    weight: z.number(),
  })
  .passthrough();

export const voiceBlendResponseSchema = z
  .object({
    blendedProfile: z
      .object({
        id: z.string(),
        primaryTwitterId: z.string(),
        additionalTwitterIds: z.array(z.string()),
        weights: z.record(z.string(), z.number()),
        tweetsAnalyzed: z.number(),
        blendSummary: nullableString.optional(),
      })
      .passthrough(),
    inspirations: z.array(blendedVoiceInspirationSchema),
    dimensions: blendedVoiceDimensionsSchema,
    styleSignals: z.record(z.string(), z.unknown()).nullable().optional(),
    summary: z.string(),
  })
  .passthrough();

export const calibrationResultSchema = z
  .object({
    confidence: z.number(),
    analysis: z.string(),
    tweetsAnalyzed: z.number(),
    twitterUser: z
      .object({
        username: z.string(),
        name: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

export const calibrationResponseSchema = z
  .object({
    profile: voiceProfileSchema,
    calibration: calibrationResultSchema,
  })
  .passthrough();

export const referenceAccountSelectionResponseSchema = z
  .object({
    success: z.boolean(),
    ids: z.array(z.string()),
  })
  .passthrough();

export const tweetDraftSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    version: z.number(),
    status: z.enum(["DRAFT", "APPROVED", "SCHEDULED", "POSTED", "ARCHIVED"]),
    confidence: optionalNullableNumber,
    predictedEngagement: optionalNullableNumber,
    actualEngagement: optionalNullableNumber,
    sourceType: z.string().optional(),
    sourceContent: z.string().optional(),
    blendId: z.string().optional(),
    feedback: z.string().optional(),
    scheduledAt: nullableString.optional(),
    postedAt: nullableString.optional(),
    createdAt: z.string(),
  })
  .passthrough();

export const draftResponseSchema = z
  .object({
    draft: tweetDraftSchema,
  })
  .passthrough();

export const draftsResponseSchema = z
  .object({
    drafts: z.array(tweetDraftSchema),
  })
  .passthrough();

export const draftGenerateResponseSchema = z
  .object({
    draft: tweetDraftSchema,
    blendWarning: z.string().optional(),
  })
  .passthrough();

export const draftThreadResponseSchema = z
  .object({
    thread: z.array(z.string()),
    count: z.number(),
  })
  .passthrough();

export const queuedDraftSchema = tweetDraftSchema
  .extend({
    _score: z.number(),
    suggestedAt: z.string(),
  })
  .passthrough();

export const queuedDraftsResponseSchema = z
  .object({
    queue: z.array(queuedDraftSchema),
    total: z.number(),
    nextUp: queuedDraftSchema.nullable(),
  })
  .passthrough();

export const teamDraftSchema = tweetDraftSchema
  .extend({
    blendName: z.string().nullable(),
    user: z
      .object({
        handle: z.string(),
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .passthrough(),
  })
  .passthrough();

export const teamDraftsResponseSchema = z
  .object({
    drafts: z.array(teamDraftSchema),
    total: z.number(),
  })
  .passthrough();

export const draftScheduleResponseSchema = z
  .object({
    draft: tweetDraftSchema,
    conflicts: z
      .array(
        z
          .object({
            id: z.string(),
            content: z.string(),
            scheduledAt: z.string(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const reorderQueueResponseSchema = z
  .object({
    reordered: z.number(),
  })
  .passthrough();

export const resetQueueOrderResponseSchema = z
  .object({
    reset: z.boolean(),
  })
  .passthrough();

export const analyticsSummarySchema = z
  .object({
    draftsCreated: z.number(),
    draftsPosted: z.number(),
    feedbackGiven: z.number(),
    refinements: z.number(),
    reportsIngested: z.number(),
    period: z.string(),
  })
  .passthrough();

export const analyticsSummaryResponseSchema = z
  .object({
    summary: analyticsSummarySchema,
  })
  .passthrough();

export const learningLogEntrySchema = z
  .object({
    id: z.string(),
    event: z.string(),
    impact: z.string(),
    positive: z.boolean(),
    createdAt: z.string(),
  })
  .passthrough();

export const learningLogResponseSchema = z
  .object({
    entries: z.array(learningLogEntrySchema),
  })
  .passthrough();

export const analyticsEventSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    value: z.number().optional(),
    metadata: z.unknown().optional(),
    createdAt: z.string(),
  })
  .passthrough();

export const analyticsEventsResponseSchema = z
  .object({
    events: z.array(analyticsEventSchema),
  })
  .passthrough();

export const dailyEngagementSchema = z
  .object({
    date: z.string(),
    dayLabel: z.string(),
    predicted: z.number(),
    actual: z.number(),
  })
  .passthrough();

export const engagementDailyResponseSchema = z
  .object({
    days: z.array(dailyEngagementSchema),
  })
  .passthrough();

export const dailyActivitySchema = z
  .object({
    date: z.string(),
    count: z.number(),
  })
  .passthrough();

export const activityDailyResponseSchema = z
  .object({
    days: z.array(dailyActivitySchema),
  })
  .passthrough();

export const dailyTeamEngagementSchema = z
  .object({
    date: z.string(),
    dayLabel: z.string(),
    modelTarget: z.number(),
    teamActual: z.number(),
  })
  .passthrough();

export const teamEngagementDailyResponseSchema = z
  .object({
    days: z.array(dailyTeamEngagementSchema),
  })
  .passthrough();

export const analystPeakSchema = z
  .object({
    name: z.string(),
    days: z.number(),
    hasDrafts: z.boolean(),
  })
  .passthrough();

export const daysToPeakResponseSchema = z
  .object({
    peaks: z.array(analystPeakSchema),
  })
  .passthrough();

export const teamAnalystSchema = z
  .object({
    id: z.string(),
    handle: z.string(),
    voiceProfile: voiceProfileSchema.nullable().optional(),
    _count: z
      .object({
        tweetDrafts: z.number(),
        analyticsEvents: z.number(),
        sessions: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

export const teamAnalyticsResponseSchema = z
  .object({
    analysts: z.array(teamAnalystSchema),
  })
  .passthrough();

export const briefingPreferenceSchema = z
  .object({
    deliveryTime: z.string(),
    topics: z.array(z.string()),
    sources: z.array(z.string()),
    channel: z.string(),
    deliveryChannel: z.string().optional(),
  })
  .passthrough();

export const briefingPreferenceResponseSchema = z
  .object({
    preference: briefingPreferenceSchema.nullable(),
  })
  .passthrough();

export const briefingSectionSchema = z
  .object({
    heading: z.string(),
    emoji: z.string(),
    bullets: z.array(z.string()),
  })
  .passthrough();

export const briefingSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    sections: z.array(briefingSectionSchema),
    topics: z.array(z.string()),
    sources: z.array(z.string()),
    createdAt: z.string(),
  })
  .passthrough();

export const briefingResponseSchema = z
  .object({
    briefing: briefingSchema,
  })
  .passthrough();

export const briefingHistoryResponseSchema = z
  .object({
    briefings: z.array(briefingSchema),
  })
  .passthrough();

export const twitterFollowRawSchema = z
  .object({
    id: z.string(),
    handle: optionalNullableString,
    display_name: optionalNullableString,
    displayName: optionalNullableString,
    bio: optionalNullableString,
    avatar_url: optionalNullableString,
    avatarUrl: optionalNullableString,
    follower_count: optionalNullableNumber,
    followerCount: optionalNullableNumber,
  })
  .passthrough();

export const twitterFollowsResponseSchema = z
  .object({
    follows: z.array(twitterFollowRawSchema),
    cached: z.boolean(),
  })
  .passthrough();

export const twitterLikeSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    author_handle: z.string().nullable(),
    author_avatar: z.string().nullable(),
    created_at: z.string().nullable(),
    like_count: z.number(),
    retweet_count: z.number(),
  })
  .passthrough();

export const twitterLikesResponseSchema = z
  .object({
    likes: z.array(twitterLikeSchema),
    cached: z.boolean(),
  })
  .passthrough();

export const teamMemberSchema = z
  .object({
    id: z.string(),
    handle: z.string(),
    displayName: z.string().nullable().optional(),
    role: z.string(),
    voiceProfile: voiceProfileSchema.nullable().optional(),
    _count: z
      .object({
        tweetDrafts: z.number(),
        sessions: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

export const usersProfileResponseSchema = z
  .object({
    user: userSchema,
  })
  .passthrough();

export const usersTeamResponseSchema = z
  .object({
    team: z.array(teamMemberSchema),
  })
  .passthrough();

export const messageAffectedResponseSchema = z
  .object({
    message: z.string(),
    affected: z.number(),
  })
  .passthrough();

export const userRoleResponseSchema = z
  .object({
    user: z
      .object({
        id: z.string(),
        role: z.string(),
      })
      .passthrough(),
  })
  .passthrough();
