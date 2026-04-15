"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  COMMON_TIMEZONES,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SETTINGS_PREFS,
  NOTIFICATION_PREF_KEYS,
  THEME_PREFS,
  type NotificationPrefs,
  type SettingsPrefs,
  type ThemePref,
  type TimezonePref,
} from "@/types/settings";

export const SETTINGS_STORAGE_KEYS = {
  theme: "atlas_theme_pref",
  timezone: "atlas_tz",
  notifications: "atlas_notif_prefs",
} as const;

const THEME_PREF_SET = new Set<ThemePref>(THEME_PREFS);
const TIMEZONE_PREF_SET = new Set<TimezonePref>(COMMON_TIMEZONES);

function isThemePref(value: string | null): value is ThemePref {
  return value !== null && THEME_PREF_SET.has(value as ThemePref);
}

function isTimezonePref(value: string | null): value is TimezonePref {
  return value !== null && TIMEZONE_PREF_SET.has(value as TimezonePref);
}

function readNotificationPrefs(raw: string | null): NotificationPrefs {
  if (!raw) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof NotificationPrefs, unknown>>;

    return NOTIFICATION_PREF_KEYS.reduce<NotificationPrefs>(
      (nextPrefs, key) => ({
        ...nextPrefs,
        [key]:
          typeof parsed[key] === "boolean"
            ? parsed[key]
            : DEFAULT_NOTIFICATION_PREFS[key],
      }),
      { ...DEFAULT_NOTIFICATION_PREFS },
    );
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

function readStoredSettings(): SettingsPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS_PREFS;
  }

  const storedTheme = window.localStorage.getItem(SETTINGS_STORAGE_KEYS.theme);
  const storedTimezone = window.localStorage.getItem(SETTINGS_STORAGE_KEYS.timezone);
  const storedNotifications = window.localStorage.getItem(
    SETTINGS_STORAGE_KEYS.notifications,
  );

  return {
    theme: isThemePref(storedTheme)
      ? storedTheme
      : DEFAULT_SETTINGS_PREFS.theme,
    timezone: isTimezonePref(storedTimezone)
      ? storedTimezone
      : DEFAULT_SETTINGS_PREFS.timezone,
    notifications: readNotificationPrefs(storedNotifications),
  };
}

function persistSettings(prefs: SettingsPrefs) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEYS.theme, prefs.theme);
  window.localStorage.setItem(SETTINGS_STORAGE_KEYS.timezone, prefs.timezone);
  window.localStorage.setItem(
    SETTINGS_STORAGE_KEYS.notifications,
    JSON.stringify(prefs.notifications),
  );
}

export interface UseSettingsResult {
  prefs: SettingsPrefs;
  setPrefs: Dispatch<SetStateAction<SettingsPrefs>>;
  loading: boolean;
}

export function useSettings(): UseSettingsResult {
  const [prefs, setPrefs] = useState<SettingsPrefs>(DEFAULT_SETTINGS_PREFS);
  const [loading, setLoading] = useState(true);
  const [readyToPersist, setReadyToPersist] = useState(false);

  useEffect(() => {
    setPrefs(readStoredSettings());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!readyToPersist) {
      setReadyToPersist(true);
      return;
    }

    persistSettings(prefs);
  }, [loading, prefs, readyToPersist]);

  return { prefs, setPrefs, loading };
}

export default useSettings;
