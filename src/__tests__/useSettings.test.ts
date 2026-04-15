import "@testing-library/jest-dom";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSettings } from "@/hooks/useSettings";

describe("useSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("should return defaults when localStorage is empty", async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.prefs).toEqual({
      theme: "auto",
      timezone: "UTC",
      notifications: {
        briefing_email: true,
        alert_push: true,
        draft_reminders: true,
        weekly_digest: true,
      },
    });
  });

  it("should round-trip settings through localStorage", async () => {
    const { result, unmount } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPrefs({
        theme: "dark",
        timezone: "America/New_York",
        notifications: {
          briefing_email: false,
          alert_push: true,
          draft_reminders: false,
          weekly_digest: true,
        },
      });
    });

    await waitFor(() =>
      expect(window.localStorage.getItem("atlas_theme_pref")).toBe("dark"),
    );
    expect(window.localStorage.getItem("atlas_tz")).toBe("America/New_York");
    expect(window.localStorage.getItem("atlas_notif_prefs")).toBe(
      JSON.stringify({
        briefing_email: false,
        alert_push: true,
        draft_reminders: false,
        weekly_digest: true,
      }),
    );

    unmount();

    const { result: nextResult } = renderHook(() => useSettings());

    await waitFor(() => expect(nextResult.current.loading).toBe(false));

    expect(nextResult.current.prefs).toEqual({
      theme: "dark",
      timezone: "America/New_York",
      notifications: {
        briefing_email: false,
        alert_push: true,
        draft_reminders: false,
        weekly_digest: true,
      },
    });
  });

  it("should persist notification toggle updates", async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPrefs((currentPrefs) => ({
        ...currentPrefs,
        notifications: {
          ...currentPrefs.notifications,
          alert_push: !currentPrefs.notifications.alert_push,
        },
      }));
    });

    await waitFor(() =>
      expect(window.localStorage.getItem("atlas_notif_prefs")).toBe(
        JSON.stringify({
          briefing_email: true,
          alert_push: false,
          draft_reminders: true,
          weekly_digest: true,
        }),
      ),
    );
  });
});
