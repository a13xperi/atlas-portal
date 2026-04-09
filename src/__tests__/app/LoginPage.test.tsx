import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const push = jest.fn();
const replace = jest.fn();
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockOnboardingShell = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/",
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    register: mockRegister,
    logout: jest.fn(),
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/layout/OnboardingShell", () => ({
  __esModule: true,
  default: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    step?: number;
    totalSteps?: number;
  }) => {
    mockOnboardingShell(props);
    return <div>{children}</div>;
  },
}));

const LoginPage = require("@/app/page").default;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form by default", () => {
    render(<LoginPage />);

    expect(mockOnboardingShell).toHaveBeenCalledWith({ maxWidth: "480px" });
    expect(screen.getByText("ATLAS")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min 6 characters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows email validation error for invalid email", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "notanemail" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it("shows password length error", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/min 6 characters/i), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("toggles between login and register mode", () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("@yourhandle")).not.toBeInTheDocument();
  });

  it("registers without showing an Atlas handle field", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "new.user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/min 6 characters/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.any(String),
        "new.user@example.com",
        "password123"
      );
    });
  });

  it("shows a password toggle control", () => {
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText(/min 6 characters/i);
    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find((button) => button !== screen.getByRole("button", { name: "Sign In" }));

    expect(toggleButton).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton!);

    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
