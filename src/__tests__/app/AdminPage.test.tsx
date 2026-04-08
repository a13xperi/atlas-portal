import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import AdminPage from "@/app/admin/page";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AdminPage", () => {
  it("shows the roadmap admin tool", () => {
    render(<AdminPage />);

    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(
      screen.getByText("Product roadmap — what's shipping, what's next, what's done")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Roadmap/i })).toHaveAttribute(
      "href",
      "/admin/roadmap"
    );
  });
});
