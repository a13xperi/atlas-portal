import "@testing-library/jest-dom";
import { renderHook, act, waitFor } from "@testing-library/react";
import { setTag, setUser } from "@sentry/nextjs";
import { AuthProvider, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ReactNode } from "react";

jest.mock("@/lib/api", () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    },
  },
  setAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
}));

const mockMe = api.auth.me as jest.Mock;
const mockLogin = api.auth.login as jest.Mock;
const mockLogout = api.auth.logout as jest.Mock;
const mockRefresh = api.auth.refresh as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("useAuth initial state", () => {
  it("settles to loading=false with no user when cookie session fails", async () => {
    mockMe.mockRejectedValue(new Error("Unauthorized"));
    mockRefresh.mockRejectedValue(new Error("No refresh token"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });
});

describe("useAuth restores session", () => {
  it("loads user from cookie session on mount", async () => {
    const mockUser = { id: "1", handle: "alice", role: "ANALYST" as const, voiceProfile: null };
    mockMe.mockResolvedValue({ user: mockUser as any });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockMe).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
    expect(setUser).toHaveBeenCalledWith({
      id: "1",
      username: "alice",
      email: undefined,
    });
    expect(setTag).toHaveBeenCalledWith("user_role", "analyst");
  });

  it("tries refresh when initial me fails, then retries me", async () => {
    const mockUser = { id: "1", handle: "alice", role: "ANALYST" as const, voiceProfile: null };
    mockMe
      .mockRejectedValueOnce(new Error("Unauthorized"))
      .mockResolvedValueOnce({ user: mockUser as any });
    mockRefresh.mockResolvedValue({ token: "new", refresh_token: "new_r" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRefresh).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
  });

  it("clears user when both me and refresh fail", async () => {
    mockMe.mockRejectedValue(new Error("Unauthorized"));
    mockRefresh.mockRejectedValue(new Error("Invalid refresh"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });
});

describe("login", () => {
  it("calls login API then fetches user via me", async () => {
    // Initial mount — no session
    mockMe.mockRejectedValueOnce(new Error("Unauthorized"));
    mockRefresh.mockRejectedValueOnce(new Error("No refresh"));

    const meRes = { user: { id: "1", handle: "alice", role: "ANALYST" as const, voiceProfile: null } };
    mockLogin.mockResolvedValue({ user: meRes.user, token: "t", refresh_token: "r" });
    mockMe.mockResolvedValue(meRes as any);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("alice@example.com", "password123");
    });

    expect(mockLogin).toHaveBeenCalledWith("alice@example.com", "password123");
    expect(result.current.user).toEqual(meRes.user);
  });
});

describe("logout", () => {
  it("calls logout API and clears user", async () => {
    const mockUser = { id: "1", handle: "alice", role: "ANALYST" as const, voiceProfile: null };
    mockMe.mockResolvedValue({ user: mockUser as any });
    mockLogout.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      result.current.logout();
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(setUser).toHaveBeenLastCalledWith(null);
    expect(setTag).toHaveBeenLastCalledWith("onboarding_track", "none");
  });
});
