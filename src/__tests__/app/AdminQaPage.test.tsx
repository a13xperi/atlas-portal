import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockToast = jest.fn();
const mockUseAuth = jest.fn(() => ({
  user: {
    id: "admin-1",
    handle: "atlas-admin",
    displayName: "Atlas Admin",
    role: "ADMIN",
  },
  loading: false,
}));

const mockApi = {
  qa: {
    listRuns: jest.fn(),
    createRun: jest.fn(),
    updateRun: jest.fn(),
    deleteRun: jest.fn(),
  },
};

jest.mock("@/lib/auth", () => ({
  useAuth: mockUseAuth,
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({ push: mockToast, toasts: [], dismiss: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  api: mockApi,
}));

const QaTestRunnerPage = require("@/app/admin/qa/page").default;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("QaTestRunnerPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.qa.listRuns.mockResolvedValue({ runs: [] });
    mockApi.qa.createRun.mockResolvedValue({
      run: {
        id: "run-2",
        project: "atlas-portal",
        tester_id: "admin-1",
        tester_name: "Atlas Admin",
        tester_initials: "AA",
        created_at: "2026-04-09T09:00:00.000Z",
        updated_at: "2026-04-09T09:00:00.000Z",
        results: {},
        summary: { pass: 0, fail: 0, skip: 0, blockers: 0, total: 0 },
        status: "in_progress",
      },
    });
    mockApi.qa.updateRun.mockResolvedValue({});
    mockApi.qa.deleteRun.mockResolvedValue({ success: true });
    window.confirm = jest.fn(() => true);
  });

  it("shows processing feedback and a success toast when creating a run", async () => {
    const deferred = createDeferred<{
      run: {
        id: string;
        project: string;
        tester_id: string;
        tester_name: string;
        tester_initials: string;
        created_at: string;
        updated_at: string;
        results: Record<string, never>;
        summary: { pass: number; fail: number; skip: number; blockers: number; total: number };
        status: "in_progress";
      };
    }>();

    mockApi.qa.createRun.mockImplementationOnce(() => deferred.promise);

    render(<QaTestRunnerPage />);

    expect(
      await screen.findByRole("heading", { name: "QA Test Runner" })
    ).toBeInTheDocument();

    const createButton = screen.getByRole("button", { name: /\+ New Run/i });

    fireEvent.click(createButton);
    fireEvent.click(createButton);

    expect(mockApi.qa.createRun).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();

    deferred.resolve({
      run: {
        id: "run-2",
        project: "atlas-portal",
        tester_id: "admin-1",
        tester_name: "Atlas Admin",
        tester_initials: "AA",
        created_at: "2026-04-09T09:00:00.000Z",
        updated_at: "2026-04-09T09:00:00.000Z",
        results: {},
        summary: { pass: 0, fail: 0, skip: 0, blockers: 0, total: 0 },
        status: "in_progress",
      },
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({ title: "Action completed", kind: "success" });
    });

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows an error toast when deleting a run fails", async () => {
    mockApi.qa.listRuns.mockResolvedValue({
      runs: [
        {
          id: "run-1",
          project: "atlas-portal",
          tester_id: "admin-1",
          tester_name: "Atlas Admin",
          tester_initials: "AA",
          created_at: "2026-04-09T09:00:00.000Z",
          updated_at: "2026-04-09T09:00:00.000Z",
          results: {},
          summary: { pass: 0, fail: 0, skip: 0, blockers: 0, total: 0 },
          status: "in_progress",
        },
      ],
    });
    mockApi.qa.deleteRun.mockRejectedValueOnce(new Error("Delete failed"));

    render(<QaTestRunnerPage />);

    expect(
      await screen.findByRole("button", { name: "Delete" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Delete this test run? This cannot be undone."
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({ title: "Delete failed", kind: "error" });
    });
  });
});
