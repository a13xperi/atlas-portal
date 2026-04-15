import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AuthCallbackError from "@/app/auth/callback/error";

describe("AuthCallbackError", () => {
  it("uses next/link for home navigation (ESLint no-html-link-for-pages)", () => {
    render(
      <AuthCallbackError error={new Error("OAuth failed")} reset={jest.fn()} />
    );

    const home = screen.getByRole("link", { name: /back to login/i });
    expect(home).toHaveAttribute("href", "/");
  });
});
