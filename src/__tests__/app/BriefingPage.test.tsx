import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BriefingPage from "@/app/briefing/page";

describe("BriefingPage", () => {
  it("renders the defaults and saves local preferences", async () => {
    const user = userEvent.setup();

    render(<BriefingPage />);

    expect(
      screen.getByText("Configure Your Daily Digest")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure your daily morning briefing. We'll prepare a personalized crypto intelligence digest every morning."
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Daily delivery time")).toHaveValue("08:00");
    expect(screen.getByText(/Local timezone:/)).toBeInTheDocument();

    const topicCheckbox = screen.getByRole("checkbox", {
      name: "AI & Crypto",
    });
    const sourceCheckbox = screen.getByRole("checkbox", {
      name: "X/Twitter",
    });
    const channelRadio = screen.getByRole("radio", {
      name: "Portal + Email",
    });

    await user.click(topicCheckbox);
    await user.click(sourceCheckbox);
    await user.click(channelRadio);
    await user.click(
      screen.getByRole("button", { name: "Save briefing preferences" })
    );

    expect(topicCheckbox).toBeChecked();
    expect(sourceCheckbox).toBeChecked();
    expect(channelRadio).toBeChecked();
    expect(
      screen.getByText("Preferences saved locally for this session.")
    ).toBeInTheDocument();
  });
});
