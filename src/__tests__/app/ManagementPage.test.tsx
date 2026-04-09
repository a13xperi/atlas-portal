import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockToast = jest.fn();
const mockUseAuth = jest.fn(() => ({
  user: { id: "manager-1", handle: "boss", role: "MANAGER" },
}));

const mockApi = {
  users: {
    team: jest.fn(),
    pushTopProfiles: jest.fn(),
    sendNudge: jest.fn(),
    pushStyle: jest.fn(),
  },
  analytics: {
    team: jest.fn(),
  },
};

jest.mock("@/lib/auth", () => ({
  useAuth: mockUseAuth,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const ManagementPage = require("@/app/management/page").default;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("ManagementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockApi.users.team.mockResolvedValue({
      team: [
        {
          id: "member-1",
          handle: "analyst1",
          displayName: "Analyst One",
          role: "ANALYST",
          _count: { tweetDrafts: 3, sessions: 2 },
        },
      ],
    });
    mockApi.analytics.team.mockResolvedValue({
      analysts: [
        {
          id: "member-1",
          handle: "analyst1",
          _count: { tweetDrafts: 3, analyticsEvents: 8, sessions: 2 },
        },
      ],
    });
    mockApi.users.pushTopProfiles.mockResolvedValue({
      message: "Done",
      affected: 1,
    });
    mockApi.users.sendNudge.mockResolvedValue({
      message: "Done",
      affected: 1,
    });
    mockApi.users.pushStyle.mockResolvedValue({
      message: "Done",
      affected: 1,
    });
  });

  it("shows a processing state, disables the action buttons, and emits a success toast", async () => {
    const deferred = createDeferred<{ message: string; affected: number }>();
    mockApi.users.pushTopProfiles.mockImplementationOnce(() => deferred.promise);

    render(<ManagementPage />);

    await screen.findByText("Analyst One");

    const pushTopProfilesButton = screen.getByRole("button", {
      name: "Push Top Profiles",
    });
    const sendNudgeButton = screen.getByRole("button", { name: "Send Nudge" });

    fireEvent.click(pushTopProfilesButton);
    fireEvent.click(pushTopProfilesButton);

    expect(mockApi.users.pushTopProfiles).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();
    expect(sendNudgeButton).toBeDisabled();

    deferred.resolve({ message: "Queued", affected: 12 });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Action completed", "success");
    });

    expect(
      screen.getByRole("button", { name: "Push Top Profiles" })
    ).toBeEnabled();
  });

  it("shows the API error message in an error toast when an action fails", async () => {
    mockApi.users.pushStyle.mockRejectedValueOnce(new Error("Style push failed"));

    render(<ManagementPage />);

    await screen.findByText("Analyst One");

    fireEvent.click(screen.getByRole("button", { name: "Push Style" }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Style push failed", "error");
    });
  });
});
