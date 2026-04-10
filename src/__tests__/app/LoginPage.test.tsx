import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

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

describe("LoginPage (X OAuth only)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Atlas heading inside the onboarding shell", () => {
    render(<LoginPage />);

    expect(mockOnboardingShell).toHaveBeenCalledWith({ maxWidth: "480px" });
    expect(screen.getByText("ATLAS")).toBeInTheDocument();
  });

  it("renders the Continue with X button", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: /continue with x/i })
    ).toBeInTheDocument();
  });

  it("does not render an email or password field", () => {
    render(<LoginPage />);

    expect(screen.queryByPlaceholderText(/you@example\.com/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/min 6 characters/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });

});
