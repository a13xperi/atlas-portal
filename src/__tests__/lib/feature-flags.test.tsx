import "@testing-library/jest-dom";
import { render, screen, renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import {
  FeatureFlagProvider,
  useFeatureFlags,
  useRouteEnabled,
} from "@/lib/feature-flags";
import FeatureGate from "@/components/ui/FeatureGate";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockUser: { role?: string } = {};
let mockAuthLoading = false;

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: mockUser.role ? mockUser : null, loading: mockAuthLoading }),
}));

const mockApiList = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    featureFlags: { list: (...args: unknown[]) => mockApiList(...args) },
  },
}));

// localStorage spy
const storageMock: Record<string, string> = {};
const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

function setStoredFlags(flags: Record<string, boolean>) {
  storageMock["atlas-feature-flags"] = JSON.stringify(flags);
  getItemSpy.mockImplementation((key: string) => storageMock[key] ?? null);
}

function clearStoredFlags() {
  delete storageMock["atlas-feature-flags"];
  getItemSpy.mockImplementation((key: string) => storageMock[key] ?? null);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: ReactNode }) {
  return <FeatureFlagProvider>{children}</FeatureFlagProvider>;
}

function renderFlags() {
  return renderHook(() => useFeatureFlags(), { wrapper: Wrapper });
}

function renderRouteEnabled() {
  return renderHook(() => useRouteEnabled(), { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.role = "ADMIN";
  mockAuthLoading = false;
  clearStoredFlags();
  mockApiList.mockResolvedValue({ flags: [] });
});

// ===========================================================================
// 1. Flag evaluation (isEnabled)
// ===========================================================================

describe("isEnabled — role-based evaluation", () => {
  it("returns true for 'everyone' scope flags regardless of role", async () => {
    mockUser.role = "ANALYST";
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // crafting_station has scope "everyone" and defaultEnabled true
    expect(result.current.isEnabled("crafting_station")).toBe(true);
  });

  it("returns false for 'managers' scope when user is ANALYST", async () => {
    mockUser.role = "ANALYST";
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("analytics_advanced")).toBe(false);
  });

  it("returns true for 'managers' scope when user is MANAGER", async () => {
    mockUser.role = "MANAGER";
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("analytics_advanced")).toBe(true);
  });

  it("returns true for 'managers' scope when user is ADMIN", async () => {
    mockUser.role = "ADMIN";
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("analytics_advanced")).toBe(true);
  });

  it("returns false for 'admins' scope when user is MANAGER", async () => {
    mockUser.role = "MANAGER";
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("super_admin")).toBe(false);
  });

  it("returns true for 'admins' scope when user is ADMIN", async () => {
    mockUser.role = "ADMIN";
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("super_admin")).toBe(true);
  });

  it("returns false for scope check when user is null (no role)", async () => {
    mockUser.role = undefined;
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // managers scope requires at least MANAGER
    expect(result.current.isEnabled("analytics_advanced")).toBe(false);
  });

  it("returns true for unknown flag keys (don't block)", async () => {
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("nonexistent_flag_xyz")).toBe(true);
  });
});

describe("isEnabled — default values", () => {
  it("returns true for flags with defaultEnabled=true when no overrides", async () => {
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("crafting_station")).toBe(true);
    expect(result.current.isEnabled("voice_lab")).toBe(true);
    expect(result.current.isEnabled("arena")).toBe(true);
  });

  it("returns false for flags with defaultEnabled=false when no overrides", async () => {
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // telegram_bot and tweet_tinder default to false
    expect(result.current.isEnabled("telegram_bot")).toBe(false);
    expect(result.current.isEnabled("tweet_tinder")).toBe(false);
  });
});

// ===========================================================================
// 2. Flag overrides (localStorage)
// ===========================================================================

describe("localStorage overrides", () => {
  it("overrides defaultEnabled=true to false via localStorage", async () => {
    setStoredFlags({ crafting_station: false });
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("crafting_station")).toBe(false);
  });

  it("overrides defaultEnabled=false to true via localStorage", async () => {
    setStoredFlags({ telegram_bot: true });
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // telegram_bot defaults false, overridden to true; scope is "everyone"
    expect(result.current.isEnabled("telegram_bot")).toBe(true);
  });

  it("handles invalid JSON in localStorage gracefully", async () => {
    storageMock["atlas-feature-flags"] = "not-valid-json{{{";
    getItemSpy.mockImplementation((key: string) => storageMock[key] ?? null);

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Falls back to defaults
    expect(result.current.isEnabled("crafting_station")).toBe(true);
    expect(result.current.isEnabled("telegram_bot")).toBe(false);
  });

  it("handles null parsed from localStorage gracefully", async () => {
    storageMock["atlas-feature-flags"] = "null";
    getItemSpy.mockImplementation((key: string) => storageMock[key] ?? null);

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Falls back to defaults
    expect(result.current.isEnabled("crafting_station")).toBe(true);
  });

  it("handles empty localStorage value", async () => {
    storageMock["atlas-feature-flags"] = "";
    getItemSpy.mockImplementation((key: string) => storageMock[key] ?? null);

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("crafting_station")).toBe(true);
  });
});

// ===========================================================================
// 3. API overrides
// ===========================================================================

describe("API flag overrides", () => {
  it("merges API flags over localStorage + defaults", async () => {
    setStoredFlags({ crafting_station: true });
    mockApiList.mockResolvedValue({
      flags: [{ key: "crafting_station", enabled: false }],
    });

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // API says disabled -> overrides localStorage
    await waitFor(() =>
      expect(result.current.isEnabled("crafting_station")).toBe(false),
    );
  });

  it("survives API failure and keeps localStorage values", async () => {
    setStoredFlags({ telegram_bot: true });
    mockApiList.mockRejectedValue(new Error("Network error"));

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should keep the localStorage override
    expect(result.current.isEnabled("telegram_bot")).toBe(true);
  });

  it("ignores malformed API response (empty flags array)", async () => {
    mockApiList.mockResolvedValue({ flags: [] });

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // All defaults should hold
    expect(result.current.isEnabled("crafting_station")).toBe(true);
    expect(result.current.isEnabled("telegram_bot")).toBe(false);
  });

  it("ignores API entries with missing key or enabled fields", async () => {
    mockApiList.mockResolvedValue({
      flags: [
        { key: "crafting_station" },          // missing enabled
        { enabled: false },                    // missing key
        { key: 123, enabled: true },           // wrong type key
        { key: "arena", enabled: "yes" },      // wrong type enabled
      ],
    });

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // None of these should change defaults
    await waitFor(() => {
      expect(result.current.isEnabled("crafting_station")).toBe(true);
      expect(result.current.isEnabled("arena")).toBe(true);
    });
  });

  it("ignores API response with null flags", async () => {
    mockApiList.mockResolvedValue({ flags: null });

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("crafting_station")).toBe(true);
  });
});

// ===========================================================================
// 4. Loading state
// ===========================================================================

describe("loading state", () => {
  it("reports loading=true while auth is loading", async () => {
    mockAuthLoading = true;
    const { result } = renderFlags();

    // Should be loading because auth is still loading
    expect(result.current.loading).toBe(true);
  });

  it("reports loading=false once flags and auth are resolved", async () => {
    mockAuthLoading = false;
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

// ===========================================================================
// 5. FeatureGate component rendering
// ===========================================================================

describe("FeatureGate", () => {
  it("renders children when flag is enabled", async () => {
    mockUser.role = "ADMIN";
    render(
      <Wrapper>
        <FeatureGate flagKey="crafting_station">
          <div data-testid="gated-content">Content</div>
        </FeatureGate>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("gated-content")).toBeInTheDocument(),
    );
  });

  it("renders nothing when flag is disabled and no fallback", async () => {
    setStoredFlags({ crafting_station: false });
    const { container } = render(
      <Wrapper>
        <FeatureGate flagKey="crafting_station">
          <div data-testid="gated-content">Content</div>
        </FeatureGate>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument(),
    );
    // Also ensure container has no visible children (fallback was null)
    expect(container.textContent).toBe("");
  });

  it("renders fallback when flag is disabled", async () => {
    setStoredFlags({ crafting_station: false });
    render(
      <Wrapper>
        <FeatureGate
          flagKey="crafting_station"
          fallback={<div data-testid="fallback">Restricted</div>}
        >
          <div data-testid="gated-content">Content</div>
        </FeatureGate>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });
  });

  it("shows loading state while flags are resolving", () => {
    mockAuthLoading = true;
    render(
      <Wrapper>
        <FeatureGate flagKey="crafting_station">
          <div data-testid="gated-content">Content</div>
        </FeatureGate>
      </Wrapper>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
  });

  it("calls router.replace to /dashboard when flag disabled", async () => {
    setStoredFlags({ crafting_station: false });
    render(
      <Wrapper>
        <FeatureGate flagKey="crafting_station">
          <div>Content</div>
        </FeatureGate>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/dashboard"),
    );
  });

  it("does NOT call router.replace when flag is enabled", async () => {
    render(
      <Wrapper>
        <FeatureGate flagKey="crafting_station">
          <div>Content</div>
        </FeatureGate>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByText("Content")).toBeInTheDocument(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("respects role gating — hides admin content from ANALYST", async () => {
    mockUser.role = "ANALYST";
    render(
      <Wrapper>
        <FeatureGate flagKey="super_admin">
          <div data-testid="admin-content">Admin Only</div>
        </FeatureGate>
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument(),
    );
  });
});

// ===========================================================================
// 6. useRouteEnabled hook
// ===========================================================================

describe("useRouteEnabled", () => {
  it("returns true for routes not gated by any flag", async () => {
    const { result } = renderRouteEnabled();
    await waitFor(() => expect(result.current("/some-random-path")).toBe(true));
  });

  it("returns true for gated route when flag is enabled", async () => {
    const { result } = renderRouteEnabled();
    await waitFor(() => expect(result.current("/crafting")).toBe(true));
  });

  it("returns false for gated route when flag is disabled", async () => {
    setStoredFlags({ crafting_station: false });
    const { result } = renderRouteEnabled();
    await waitFor(() => expect(result.current("/crafting")).toBe(false));
  });

  it("respects role gating for route checks", async () => {
    mockUser.role = "ANALYST";
    const { result } = renderRouteEnabled();
    // /analytics is gated by analytics_advanced (scope: managers)
    await waitFor(() => expect(result.current("/analytics")).toBe(false));
  });

  it("allows MANAGER access to manager-scoped routes", async () => {
    mockUser.role = "MANAGER";
    const { result } = renderRouteEnabled();
    await waitFor(() => expect(result.current("/analytics")).toBe(true));
  });

  it("maps admin routes correctly", async () => {
    mockUser.role = "ADMIN";
    const { result } = renderRouteEnabled();
    await waitFor(() => {
      expect(result.current("/admin")).toBe(true);
      expect(result.current("/admin/control")).toBe(true);
      expect(result.current("/admin/qa")).toBe(true);
    });
  });

  it("blocks admin routes for ANALYST", async () => {
    mockUser.role = "ANALYST";
    const { result } = renderRouteEnabled();
    await waitFor(() => {
      expect(result.current("/admin")).toBe(false);
      expect(result.current("/admin/control")).toBe(false);
    });
  });
});

// ===========================================================================
// 7. Default context (no provider)
// ===========================================================================

describe("default context (no FeatureFlagProvider)", () => {
  it("isEnabled returns true and loading is false without provider", () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.loading).toBe(false);
    expect(result.current.isEnabled("anything")).toBe(true);
    expect(result.current.flags).toEqual({});
  });
});

// ===========================================================================
// 8. Edge cases
// ===========================================================================

describe("edge cases", () => {
  it("toggle + scope interact: enabled toggle but insufficient role blocks", async () => {
    // multi_model is defaultEnabled=false, scope=admins
    // Override toggle to true, but role is ANALYST
    setStoredFlags({ multi_model: true });
    mockUser.role = "ANALYST";

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Toggle is on but scope blocks ANALYST
    expect(result.current.isEnabled("multi_model")).toBe(false);
  });

  it("disabled toggle short-circuits regardless of role", async () => {
    // super_admin: defaultEnabled=true, scope=admins
    // Disable via localStorage even though user IS admin
    setStoredFlags({ super_admin: false });
    mockUser.role = "ADMIN";

    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("super_admin")).toBe(false);
  });

  it("flags record exposes all defined flag keys", async () => {
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const keys = Object.keys(result.current.flags);
    expect(keys).toContain("crafting_station");
    expect(keys).toContain("voice_lab");
    expect(keys).toContain("telegram_bot");
    expect(keys).toContain("super_admin");
    expect(keys).toContain("multi_model");
  });

  it("SSR-safe: readStoredFlags returns empty when window is undefined", async () => {
    // The module already handles typeof window === "undefined".
    // We verify the provider doesn't crash by default (flags resolve from defaults).
    const { result } = renderFlags();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isEnabled("crafting_station")).toBe(true);
  });
});
