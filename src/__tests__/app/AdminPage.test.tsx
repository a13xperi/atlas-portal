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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "admin-1", handle: "admin", role: "ADMIN" },
    loading: false,
  }),
}));

describe("AdminPage", () => {
  it("shows the roadmap admin tool", () => {
    render(<AdminPage />);

    expect(
      screen.getByText("Product roadmap — what's shipping, what's next, what's done")
    ).toBeInTheDocument();
    const roadmapLinks = screen.getAllByRole("link").filter((el) => el.getAttribute("href") === "/admin/roadmap");
    expect(roadmapLinks.length).toBeGreaterThan(0);
  });
});
