export const THEME_PREFS = ["light", "dark", "auto"] as const;

export type ThemePref = (typeof THEME_PREFS)[number];

export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Copenhagen",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export type TimezonePref = (typeof COMMON_TIMEZONES)[number];

export interface NotificationPrefs {
  briefing_email: boolean;
  alert_push: boolean;
  draft_reminders: boolean;
  weekly_digest: boolean;
}

export interface SettingsPrefs {
  theme: ThemePref;
  timezone: TimezonePref;
  notifications: NotificationPrefs;
}

export const NOTIFICATION_PREF_KEYS = [
  "briefing_email",
  "alert_push",
  "draft_reminders",
  "weekly_digest",
] as const satisfies ReadonlyArray<keyof NotificationPrefs>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  briefing_email: true,
  alert_push: true,
  draft_reminders: true,
  weekly_digest: true,
};

export const DEFAULT_SETTINGS_PREFS: SettingsPrefs = {
  theme: "auto",
  timezone: "UTC",
  notifications: DEFAULT_NOTIFICATION_PREFS,
};
