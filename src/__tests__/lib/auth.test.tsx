import "@testing-library/jest-dom";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ReactNode } from "react";

jest.mock("@/lib/api", () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
      refresh: jest.fn(),
      me: jest.fn(),
    },
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

describe("useAuth initial state", () => {
  it("settles to loading=false with no user when no token saved", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

describe("useAuth restores session", () => {
  it("loads user from localStorage token on mount", async () => {
    localStorage.setItem("atlas_token", "saved_tok");
    const mockUser = { id: "1", handle: "alice", role: "ANALYST" as const, voiceProfile: null };
    mockApi.auth.me.mockResolvedValue({ user: mockUser as any });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.auth.me).toHaveBeenCalledWith("saved_tok");
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe("saved_tok");
  });

  it("clears invalid token on mount", async () => {
    localStorage.setItem("atlas_token", "bad_tok");
    mockApi.auth.me.mockRejectedValue(new Error("Unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("atlas_token")).toBeNull();
  });
});

describe("login", () => {
  it("stores token and fetches user", async () => {
    const loginRes = { user: { id: "1", handle: "alice", role: "ANALYST" as const }, token: "new_tok", refresh_token: "new_refresh" };
    const meRes = { user: { id: "1", handle: "alice", role: "ANALYST" as const, voiceProfile: null } };
    mockApi.auth.login.mockResolvedValue(loginRes);
    mockApi.auth.me.mockResolvedValue(meRes as any);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("alice@example.com", "password123");
    });

    expect(localStorage.getItem("atlas_token")).toBe("new_tok");
    expect(localStorage.getItem("atlas_refresh_token")).toBe("new_refresh");
    expect(result.current.token).toBe("new_tok");
    expect(result.current.user).toEqual(meRes.user);
  });
});

describe("logout", () => {
  it("clears token and user", async () => {
    localStorage.setItem("atlas_token", "tok");
    const mockUser = { id: "1", handle: "alice", role: "ANALYST" as const, voiceProfile: null };
    mockApi.auth.me.mockResolvedValue({ user: mockUser as any });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("atlas_token")).toBeNull();
  });
});
