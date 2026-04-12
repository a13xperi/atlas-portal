import "@testing-library/jest-dom";
import { renderHook, act, waitFor } from "@testing-library/react";
import { DemoModeProvider, useDemoMode } from "@/lib/demo-mode";
import { setDemoMode as setApiDemoMode } from "@/lib/api";
import { ReactNode } from "react";

jest.mock("@/lib/api", () => ({
  setDemoMode: jest.fn(),
}));

const mockSetApiDemoMode = setApiDemoMode as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
  <DemoModeProvider>{children}</DemoModeProvider>
);

beforeEach(() => {
  jest.resetAllMocks();
  sessionStorage.clear();
});

// ---------------------------------------------------------------------------
// isDemoMode -- initial state
// ---------------------------------------------------------------------------
describe("isDemoMode", () => {
  it("defaults to false when sessionStorage is empty", async () => {
    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(false));
  });

  it("initialises to true when sessionStorage flag is set", async () => {
    sessionStorage.setItem("atlas_demo_mode", "true");

    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(true));
    expect(mockSetApiDemoMode).toHaveBeenCalledWith(true);
  });

  it("initialises to false when sessionStorage flag is 'false'", async () => {
    sessionStorage.setItem("atlas_demo_mode", "false");

    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(false));
    expect(mockSetApiDemoMode).toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// enableDemoMode / disableDemoMode via toggleDemoMode
// ---------------------------------------------------------------------------
describe("toggleDemoMode (enable / disable)", () => {
  it("enables demo mode from off state", async () => {
    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(false));

    act(() => {
      result.current.toggleDemoMode();
    });

    expect(sessionStorage.getItem("atlas_demo_mode")).toBe("true");
    expect(mockSetApiDemoMode).toHaveBeenCalledWith(true);
  });

  it("disables demo mode from on state", async () => {
    sessionStorage.setItem("atlas_demo_mode", "true");

    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(true));

    act(() => {
      result.current.toggleDemoMode();
    });

    expect(sessionStorage.getItem("atlas_demo_mode")).toBe("false");
    expect(mockSetApiDemoMode).toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// setDemoModeQuiet (enable / disable without reload)
// ---------------------------------------------------------------------------
describe("setDemoModeQuiet", () => {
  it("enables demo mode without page reload", async () => {
    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(false));

    act(() => {
      result.current.setDemoModeQuiet(true);
    });

    expect(result.current.isDemoMode).toBe(true);
    expect(sessionStorage.getItem("atlas_demo_mode")).toBe("true");
    expect(mockSetApiDemoMode).toHaveBeenCalledWith(true);
  });

  it("disables demo mode without page reload", async () => {
    sessionStorage.setItem("atlas_demo_mode", "true");

    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(true));

    act(() => {
      result.current.setDemoModeQuiet(false);
    });

    expect(result.current.isDemoMode).toBe(false);
    expect(sessionStorage.getItem("atlas_demo_mode")).toBe("false");
    expect(mockSetApiDemoMode).toHaveBeenCalledWith(false);
  });

  it("can toggle on then off in sequence", async () => {
    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(false));

    act(() => result.current.setDemoModeQuiet(true));
    expect(result.current.isDemoMode).toBe(true);

    act(() => result.current.setDemoModeQuiet(false));
    expect(result.current.isDemoMode).toBe(false);
    expect(sessionStorage.getItem("atlas_demo_mode")).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// DemoModeProvider -- context wiring
// ---------------------------------------------------------------------------
describe("DemoModeProvider context", () => {
  it("syncs API demo mode flag on mount", async () => {
    sessionStorage.setItem("atlas_demo_mode", "true");

    renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() =>
      expect(mockSetApiDemoMode).toHaveBeenCalledWith(true),
    );
  });

  it("provides stable callback references across renders", async () => {
    const { result, rerender } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current.isDemoMode).toBe(false));

    const toggle1 = result.current.toggleDemoMode;
    const quiet1 = result.current.setDemoModeQuiet;

    rerender();

    expect(result.current.toggleDemoMode).toBe(toggle1);
    expect(result.current.setDemoModeQuiet).toBe(quiet1);
  });

  it("useDemoMode outside provider returns defaults", () => {
    const { result } = renderHook(() => useDemoMode());

    expect(result.current.isDemoMode).toBe(false);
    expect(typeof result.current.toggleDemoMode).toBe("function");
    expect(typeof result.current.setDemoModeQuiet).toBe("function");
  });
});
