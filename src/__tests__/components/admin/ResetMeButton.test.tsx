import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResetMeButton from "@/components/admin/ResetMeButton";

const mockReplace = jest.fn();
const mockResetUser = jest.fn();
const mockSetAccessToken = jest.fn();
let mockUser: { id: string; handle: string; role: string } | null = {
  id: "admin-1",
  handle: "admin",
  role: "ADMIN",
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    admin: {
      resetUser: (...args: unknown[]) => mockResetUser(...args),
    },
  },
  setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

describe("ResetMeButton", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envWritable = process.env as any;

  beforeEach(() => {
    mockUser = { id: "admin-1", handle: "admin", role: "ADMIN" };
    mockResetUser.mockResolvedValue({ success: true });
    mockReplace.mockReset();
    mockSetAccessToken.mockReset();
    document.cookie = "atlas_session=; path=/; max-age=0";
    envWritable.NODE_ENV = originalNodeEnv;
    window.confirm = jest.fn(() => true);
  });

  afterAll(() => {
    envWritable.NODE_ENV = originalNodeEnv;
  });

  it("renders for admins", () => {
    render(<ResetMeButton />);

    expect(
      screen.getByRole("button", { name: "Reset Me" }),
    ).toBeInTheDocument();
  });

  it("stays hidden for non-admin users outside development", () => {
    mockUser = { id: "analyst-1", handle: "analyst", role: "ANALYST" };

    render(<ResetMeButton />);

    expect(
      screen.queryByRole("button", { name: "Reset Me" }),
    ).not.toBeInTheDocument();
  });

  it("renders in development for non-admin users", () => {
    mockUser = { id: "analyst-1", handle: "analyst", role: "ANALYST" };
    envWritable.NODE_ENV = "development";

    render(<ResetMeButton />);

    expect(
      screen.getByRole("button", { name: "Reset Me" }),
    ).toBeInTheDocument();
  });

  it("confirms, resets, clears the session hint, and redirects", async () => {
    document.cookie = "atlas_session=1; path=/";

    render(<ResetMeButton />);
    fireEvent.click(screen.getByRole("button", { name: "Reset Me" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Reset your account to new-user state?",
    );

    await waitFor(() => {
      expect(mockResetUser).toHaveBeenCalledTimes(1);
    });

    expect(mockSetAccessToken).toHaveBeenCalledWith(null);
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/track-a");
    expect(document.cookie).not.toContain("atlas_session=1");
  });
});
