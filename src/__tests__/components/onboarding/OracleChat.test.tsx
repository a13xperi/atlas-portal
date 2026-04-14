import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";

function runAllChatTimers() {
  // The chat schedules nested setTimeouts for each pending message.
  // We need to flush them iteratively so React effects can schedule
  // the next timer between each act() batch.
  for (let i = 0; i < 10; i++) {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  }
}
import OracleChat from "@/components/onboarding/OracleChat";

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockUseAuth = jest.fn();
const mockXStatus = jest.fn();
const mockXAuthorize = jest.fn();
const mockUpdateProfile = jest.fn();
const mockVoiceUpdateProfile = jest.fn();
const mockCalibrate = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/api", () => ({
  api: {
    auth: {
      x: {
        status: () => mockXStatus(),
        authorize: () => mockXAuthorize(),
      },
    },
    users: {
      updateProfile: (data: unknown) => mockUpdateProfile(data),
    },
    voice: {
      updateProfile: (data: unknown) => mockVoiceUpdateProfile(data),
      calibrate: (handle: string) => mockCalibrate(handle),
    },
  },
}));

// Stub heavy child components so tests focus on OracleChat orchestration.
jest.mock("@/components/onboarding/OracleAvatar", () => {
  return function MockOracleAvatar({ size }: { size: string }) {
    return <div data-testid="oracle-avatar" data-size={size} />;
  };
});

jest.mock("@/components/onboarding/OracleMessage", () => {
  return function MockOracleMessage({
    message,
    isLast,
    onAction,
  }: {
    message: { role: string; content: string; actions?: unknown[] };
    isLast?: boolean;
    onAction?: (value: string) => void;
  }) {
    return (
      <div
        data-testid="oracle-message"
        data-role={message.role}
        data-islast={String(isLast)}
      >
        <span data-testid="message-content">{message.content}</span>
        {isLast &&
          message.actions?.map((a: any) => (
            <button
              key={a.value}
              data-testid={`action-${a.value}`}
              onClick={() => onAction?.(a.value)}
            >
              {a.label}
            </button>
          ))}
      </div>
    );
  };
});

jest.mock("@/components/onboarding/TypingIndicator", () => {
  return function MockTypingIndicator() {
    return <div data-testid="typing-indicator">Typing...</div>;
  };
});

jest.mock("@/components/onboarding/TrackBadge", () => {
  return function MockTrackBadge() {
    return <div data-testid="track-badge" />;
  };
});

jest.mock("@/components/ui/NavBar", () => {
  return function MockNavBar() {
    return <nav data-testid="navbar" />;
  };
});

describe("OracleChat", () => {
  let originalURLSearchParams: typeof URLSearchParams;

  beforeEach(() => {
    // scrollIntoView is not implemented in jsdom
    Element.prototype.scrollIntoView = jest.fn();
    jest.useFakeTimers();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockUseAuth.mockReturnValue({ user: null });
    mockXStatus.mockResolvedValue({ linked: false });
    mockXAuthorize.mockResolvedValue({ url: "https://x.com/oauth" });
    mockUpdateProfile.mockResolvedValue({});
    mockVoiceUpdateProfile.mockResolvedValue({});
    mockCalibrate.mockResolvedValue({
      profile: {},
      calibration: { analysis: "Great voice!", tweetsAnalyzed: 42 },
    });

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch {}

    // @ts-expect-error mocking history
    window.history.replaceState = jest.fn();

    originalURLSearchParams = URLSearchParams;
  });

  afterEach(() => {
    global.URLSearchParams = originalURLSearchParams;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the welcome flow on initial mount", async () => {
    render(<OracleChat />);

    expect(screen.getByText("The Oracle")).toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toBeInTheDocument();

    // Welcome messages are pending and should drain via typing effect
    runAllChatTimers();
    await waitFor(() => {
      const messages = screen.getAllByTestId("oracle-message");
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows the x-oauth action area at CONNECT_X after starting onboarding", async () => {
    render(<OracleChat />);

    runAllChatTimers();

    await waitFor(() => {
      expect(
        screen.getByTestId("action-start-onboarding")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("action-start-onboarding"));

    runAllChatTimers();

    await waitFor(() => {
      expect(
        screen.getByTestId("action-skip-x")
      ).toBeInTheDocument();
    });
  });

  it("drains pending messages through the typing indicator", async () => {
    render(<OracleChat />);

    // Initially there should be a typing indicator because pending messages exist
    await waitFor(() => {
      expect(screen.getByTestId("typing-indicator")).toBeInTheDocument();
    });

    // Fast-forward through the typing delays to drain all welcome messages
    runAllChatTimers();

    await waitFor(() => {
      const messages = screen.getAllByTestId("oracle-message");
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows back button after advancing and lets the user go back", async () => {
    render(<OracleChat />);

    runAllChatTimers();

    await waitFor(() => {
      expect(
        screen.queryByTestId("action-start-onboarding")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("action-start-onboarding"));

    runAllChatTimers();

    // Now at CONNECT_X — back button should be visible
    await waitFor(() => {
      expect(screen.getByText("← Back")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("← Back"));

    runAllChatTimers();

    // We should be back at WELCOME
    await waitFor(() => {
      expect(
        screen.queryByTestId("action-start-onboarding")
      ).toBeInTheDocument();
    });
  });

  it("advances to track b when skip-x is clicked", async () => {
    render(<OracleChat />);

    runAllChatTimers();

    await waitFor(() => {
      expect(
        screen.getByTestId("action-start-onboarding")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("action-start-onboarding"));

    runAllChatTimers();

    // Wait for the skip-x action in CONNECT_X
    await waitFor(() => {
      expect(
        screen.queryByTestId("action-skip-x")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("action-skip-x"));

    runAllChatTimers();

    await waitFor(() => {
      const userMessages = screen
        .getAllByTestId("oracle-message")
        .filter((m) => m.getAttribute("data-role") === "user");
      const lastUser = userMessages[userMessages.length - 1];
      expect(lastUser).toHaveTextContent(/set up manually/i);
    });
  });
});
