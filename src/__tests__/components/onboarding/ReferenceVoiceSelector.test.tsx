import "@testing-library/jest-dom";
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReferenceVoiceSelector from "@/components/onboarding/ReferenceVoiceSelector";

const mockGetAll = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    referenceAccounts: {
      getAll: () => mockGetAll(),
    },
  },
}));

function SelectorHarness({
  minRequired,
  onContinue = jest.fn(),
}: {
  minRequired?: number;
  onContinue?: jest.Mock;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <ReferenceVoiceSelector
      minRequired={minRequired}
      onContinue={onContinue}
      onSelectionChange={setSelected}
      selected={selected}
    />
  );
}

describe("ReferenceVoiceSelector", () => {
  beforeEach(() => {
    mockGetAll.mockReset();
  });

  it("shows fallback accounts immediately while fetch is pending", () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));

    render(<SelectorHarness />);

    // Fallback list renders immediately — no loading spinner
    expect(screen.getByText("Haseeb Qureshi")).toBeInTheDocument();
    expect(screen.getByText("@hosseeb")).toBeInTheDocument();
  });

  it("loads accounts, renders letter fallbacks, and filters by category", async () => {
    mockGetAll.mockResolvedValue({
      accounts: [
        {
          id: "hosseeb",
          name: "Haseeb",
          handle: "hosseeb",
          profileImageUrl: null,
        },
        {
          id: "DefiIgnas",
          name: "Ignas",
          handle: "DefiIgnas",
          avatarUrl: "https://example.com/ignas.png",
          category: "DeFi",
        },
        {
          id: "naval",
          name: "Naval",
          handle: "naval",
          profileImageUrl: null,
          category: "Philosophy",
        },
      ],
    });

    render(<SelectorHarness />);

    expect(await screen.findByText("Haseeb")).toBeInTheDocument();
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getByText("@hosseeb")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "DeFi" }));

    await waitFor(() => {
      expect(screen.getByText("Ignas")).toBeInTheDocument();
      expect(screen.queryByText("Haseeb")).not.toBeInTheDocument();
      expect(screen.queryByText("Naval")).not.toBeInTheDocument();
    });
  });

  it("keeps selection in the parent and enables continue after the minimum is met", async () => {
    const onContinue = jest.fn();

    mockGetAll.mockResolvedValue({
      accounts: [
        { id: "hosseeb", name: "Haseeb", handle: "hosseeb" },
        { id: "DefiIgnas", name: "Ignas", handle: "DefiIgnas" },
        { id: "naval", name: "Naval", handle: "naval" },
      ],
    });

    render(<SelectorHarness onContinue={onContinue} />);

    const continueButton = await screen.findByRole("button", {
      name: /continue/i,
    });

    expect(continueButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Haseeb" })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Toggle Ignas" })
    );

    await waitFor(() => {
      expect(screen.getByText("2 selected")).toBeInTheDocument();
      expect(continueButton).toBeEnabled();
    });

    fireEvent.click(continueButton);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("falls back to the hardcoded list when the fetch fails", async () => {
    mockGetAll.mockRejectedValue(new Error("boom"));

    render(<SelectorHarness />);

    expect(await screen.findByText("Haseeb Qureshi")).toBeInTheDocument();
    expect(screen.getByText("@hosseeb")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crypto/VC" })).toBeInTheDocument();
  });
});
