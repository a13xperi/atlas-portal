import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminRoadmapPage from "@/app/admin/roadmap/page";

function createMockResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  });
}

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("AdminRoadmapPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the empty state when no tasks are returned", async () => {
    global.fetch = jest.fn().mockImplementation(() => createMockResponse([])) as jest.Mock;

    render(<AdminRoadmapPage />);

    expect(await screen.findByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
    expect(screen.getByText(/No roadmap tasks found yet/i)).toBeInTheDocument();
    expect((global.fetch as jest.Mock).mock.calls[0]?.[0]).toContain(
      "project=in.(atlas-portal,atlas-backend)"
    );
  });

  it("renders tasks from Supabase and filters them by initiative, project, and search", async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      createMockResponse([
        {
          id: 1,
          project: "atlas-portal",
          task_name: "Ship onboarding polish",
          phase: "launch",
          status: "ready",
          points: 3,
          tier: "auto",
          route: "codex",
          initiative: "onboarding",
          company: "delphi",
          priority: "high",
          difficulty: null,
          blocked_by: null,
          notes: null,
          created_at: "2026-04-08T09:00:00.000Z",
          updated_at: "2026-04-09T09:00:00.000Z",
        },
        {
          id: 2,
          project: "atlas-backend",
          task_name: "Campaign sync worker",
          phase: "integration",
          status: "built",
          points: 5,
          tier: "manual",
          route: "claude-code",
          initiative: "campaigns",
          company: "delphi",
          priority: "medium",
          difficulty: null,
          blocked_by: null,
          notes: null,
          created_at: "2026-04-07T09:00:00.000Z",
          updated_at: "2026-04-09T08:00:00.000Z",
        },
        {
          id: 3,
          project: "atlas-portal",
          task_name: "Harden session refresh",
          phase: "hardening",
          status: "done",
          points: 2,
          tier: "manual",
          route: "manual",
          initiative: "hardening",
          company: "delphi",
          priority: "low",
          difficulty: null,
          blocked_by: null,
          notes: null,
          created_at: "2026-04-05T09:00:00.000Z",
          updated_at: "2026-04-08T08:00:00.000Z",
        },
      ])
    ) as jest.Mock;

    render(<AdminRoadmapPage />);

    expect(await screen.findByText("Ship onboarding polish")).toBeInTheDocument();
    expect(screen.getByText("Campaign sync worker")).toBeInTheDocument();
    expect(screen.getByText("Harden session refresh")).toBeInTheDocument();
    expect(screen.getByText("Points Remaining")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Initiative"), {
      target: { value: "campaigns" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Ship onboarding polish")).not.toBeInTheDocument();
      expect(screen.getByText("Campaign sync worker")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Project"), {
      target: { value: "atlas-backend" },
    });

    await waitFor(() => {
      expect(screen.getByText("Campaign sync worker")).toBeInTheDocument();
      expect(screen.queryByText("No roadmap tasks match the current filters.")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Search task name"), {
      target: { value: "sync" },
    });

    expect(screen.getByDisplayValue("sync")).toBeInTheDocument();
    expect(screen.getByText("Campaign sync worker")).toBeInTheDocument();
  });

  it("shows the error state and retry action when the fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network exploded")) as jest.Mock;

    render(<AdminRoadmapPage />);

    expect(await screen.findByText("Network exploded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
