import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import AlertsPage from "@/app/alerts/page";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AlertsPage", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("shows the empty state and routes the CTA to subscription setup", () => {
    render(<AlertsPage />);

    expect(
      screen.getByText(
        "No alerts yet — configure your subscriptions to start receiving signals."
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Enable Subscriptions" })
    );

    expect(push).toHaveBeenCalledWith("/telegram");
  });
});
