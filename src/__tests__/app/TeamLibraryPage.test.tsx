import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";

const mockUseAuth = jest.fn();
const mockUsersTeam = jest.fn();
const mockRecipeCard = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/team-library",
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/voice-profiles/RecipeCard", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockRecipeCard(props);
    return <div data-testid="recipe-card" />;
  },
}));

jest.mock("@/lib/api", () => ({
  api: {
    users: {
      team: (...args: unknown[]) => mockUsersTeam(...args),
    },
  },
}));

const TeamLibraryPage = require("@/app/team-library/page").default;

describe("TeamLibraryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "u1", handle: "testuser", role: "ANALYST" },
      token: "mock-token",
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    mockUsersTeam.mockResolvedValue({
      team: [
        {
          id: "u2",
          handle: "alice",
          displayName: "Alice",
          role: "ANALYST",
          voiceProfile: {
            humor: 60,
            formality: 40,
            brevity: 70,
            contrarianTone: 50,
            directness: 55,
            warmth: 45,
            technicalDepth: 65,
            confidence: 50,
            evidenceOrientation: 55,
            solutionOrientation: 50,
            socialPosture: 45,
            selfPromotionalIntensity: 40,
            maturity: "INTERMEDIATE",
            tweetsAnalyzed: 42,
          },
          _count: { tweetDrafts: 10, sessions: 5 },
        },
        {
          id: "u3",
          handle: "bob",
          displayName: "Bob",
          role: "ANALYST",
          voiceProfile: null,
          _count: { tweetDrafts: 0, sessions: 0 },
        },
      ],
    });
  });

  it("renders team voice recipes", async () => {
    render(<TeamLibraryPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("recipe-card").length).toBeGreaterThan(0);
    });

    expect(mockRecipeCard).toHaveBeenCalledTimes(1);
    const call = mockRecipeCard.mock.calls[0][0];
    expect(call.blend.id).toBe("u2");
    expect(call.blend.voices[0].label).toBe("Alice");
    expect(call.isActive).toBe(false);
  });

  it("shows empty state when no team members have voice profiles", async () => {
    mockUsersTeam.mockResolvedValue({
      team: [
        {
          id: "u3",
          handle: "bob",
          displayName: "Bob",
          role: "ANALYST",
          voiceProfile: null,
          _count: { tweetDrafts: 0, sessions: 0 },
        },
      ],
    });

    render(<TeamLibraryPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /No team voice recipes yet\. Team members need to calibrate their voice profiles before they appear here\./i
        )
      ).toBeInTheDocument();
    });
  });
});
