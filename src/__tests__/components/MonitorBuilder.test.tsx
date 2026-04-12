import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonitorBuilder from "@/components/alerts/MonitorBuilder";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    alerts: {
      subscribe: jest.fn(),
      toggleSubscription: jest.fn(),
      deleteSubscription: jest.fn(),
    },
  },
}));

const mockSubscribe = api.alerts.subscribe as jest.Mock;
const mockToggle = api.alerts.toggleSubscription as jest.Mock;
const mockDelete = api.alerts.deleteSubscription as jest.Mock;

const baseSub = {
  id: "sub-1",
  type: "TOPIC",
  value: "Ethereum L2",
  isActive: true,
  delivery: ["in_app"],
};

function renderBuilder(
  subscriptions = [] as typeof baseSub[],
  onChange = jest.fn()
) {
  return render(
    <MonitorBuilder
      subscriptions={subscriptions}
      onSubscriptionChange={onChange}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribe.mockResolvedValue({ subscription: baseSub });
  mockToggle.mockResolvedValue({ subscription: baseSub });
  mockDelete.mockResolvedValue({ success: true });
});

/* ------------------------------------------------------------------ */
/*  FORM VISIBILITY                                                   */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — form visibility", () => {
  it("renders the header and hides the form by default", () => {
    renderBuilder();
    expect(screen.getByText("Signal Monitors")).toBeInTheDocument();
    expect(screen.queryByText("Create Monitor")).not.toBeInTheDocument();
  });

  it("toggles the creation form with the New Monitor button", async () => {
    renderBuilder();
    const toggle = screen.getByText("+ New Monitor");

    await userEvent.click(toggle);
    expect(screen.getByText("Create Monitor")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Create Monitor")).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  MONITOR TYPE SELECTION                                            */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — monitor type selection", () => {
  it("defaults to NLP Topic type with topic input and suggestions", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));

    expect(screen.getByLabelText("Topic")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Ethereum L2 scaling")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin ETF")).toBeInTheDocument();
    expect(screen.getByText("DeFi Governance")).toBeInTheDocument();
  });

  it("clicking a suggested topic fills the input", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Bitcoin ETF"));

    expect(screen.getByLabelText("Topic")).toHaveValue("Bitcoin ETF");
  });

  it("switching to Keyword type shows keyword input", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Keyword"));

    expect(screen.getByLabelText("Keyword")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a keyword and press Enter")).toBeInTheDocument();
  });

  it("switching to Account type shows handle input", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Account"));

    expect(screen.getByLabelText("X Handle")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("@handle")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  KEYWORD INPUT                                                     */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — keyword input", () => {
  async function openKeywordMode() {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Keyword"));
  }

  it("adds a keyword via Enter key", async () => {
    await openKeywordMode();
    const input = screen.getByLabelText("Keyword");

    await userEvent.type(input, "DeFi{Enter}");

    expect(screen.getByText("DeFi")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("adds a keyword via the Add button", async () => {
    await openKeywordMode();
    const input = screen.getByLabelText("Keyword");

    await userEvent.type(input, "Restaking");
    await userEvent.click(screen.getByText("Add"));

    expect(screen.getByText("Restaking")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("does not add duplicate keywords", async () => {
    await openKeywordMode();
    const input = screen.getByLabelText("Keyword");

    await userEvent.type(input, "MEV{Enter}");
    await userEvent.type(input, "MEV{Enter}");

    const chips = screen.getAllByText("MEV");
    expect(chips).toHaveLength(1);
  });

  it("does not add empty or whitespace-only keywords", async () => {
    await openKeywordMode();
    const input = screen.getByLabelText("Keyword");

    await userEvent.type(input, "   {Enter}");
    expect(screen.queryByLabelText(/Remove keyword/)).not.toBeInTheDocument();
  });

  it("removes a keyword chip", async () => {
    await openKeywordMode();
    const input = screen.getByLabelText("Keyword");

    await userEvent.type(input, "Solana{Enter}");
    expect(screen.getByText("Solana")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Remove keyword Solana"));
    expect(screen.queryByText("Solana")).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  SENTIMENT FILTER                                                  */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — sentiment filter", () => {
  it("renders all sentiment options with 'any' selected by default", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));

    for (const s of ["any", "bullish", "bearish", "neutral"]) {
      expect(screen.getByText(s)).toBeInTheDocument();
    }
  });

  it("appends sentiment tag when a non-any filter is selected", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder subscriptions={[]} onSubscriptionChange={onChange} />
    );
    await userEvent.click(screen.getByText("+ New Monitor"));

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "Ethereum L2");
    await userEvent.click(screen.getByText("bullish"));
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(
        "TOPIC",
        "Ethereum L2 [sentiment:bullish]",
        ["in_app"]
      );
    });
  });

  it("does not append sentiment tag when 'any' is selected", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder subscriptions={[]} onSubscriptionChange={onChange} />
    );
    await userEvent.click(screen.getByText("+ New Monitor"));

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "Bitcoin ETF");
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(
        "TOPIC",
        "Bitcoin ETF",
        ["in_app"]
      );
    });
  });
});

/* ------------------------------------------------------------------ */
/*  DELIVERY OPTIONS                                                  */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — delivery options", () => {
  it("starts with In-App delivery selected", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));

    expect(screen.getByText("In-App")).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();
  });

  it("toggles Telegram delivery on and off", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder subscriptions={[]} onSubscriptionChange={onChange} />
    );
    await userEvent.click(screen.getByText("+ New Monitor"));

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "Stablecoin Regulation");

    // Add Telegram
    await userEvent.click(screen.getByText("Telegram"));
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(
        "TOPIC",
        "Stablecoin Regulation",
        ["in_app", "telegram"]
      );
    });
  });

  it("allows deselecting In-App so only Telegram remains", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder subscriptions={[]} onSubscriptionChange={onChange} />
    );
    await userEvent.click(screen.getByText("+ New Monitor"));

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "AI x Crypto");

    // Toggle: add Telegram, remove In-App
    await userEvent.click(screen.getByText("Telegram"));
    await userEvent.click(screen.getByText("In-App"));
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(
        "TOPIC",
        "AI x Crypto",
        ["telegram"]
      );
    });
  });
});

/* ------------------------------------------------------------------ */
/*  VALIDATION                                                        */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — validation", () => {
  it("shows an error when creating a topic monitor with empty value", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Create Monitor"));

    expect(
      screen.getByText("Enter a topic, keyword, or account to monitor.")
    ).toBeInTheDocument();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("shows an error when creating a keyword monitor with no keywords", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Keyword"));
    await userEvent.click(screen.getByText("Create Monitor"));

    expect(
      screen.getByText("Enter a topic, keyword, or account to monitor.")
    ).toBeInTheDocument();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("shows an error when creating an account monitor with empty handle", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Account"));
    await userEvent.click(screen.getByText("Create Monitor"));

    expect(
      screen.getByText("Enter a topic, keyword, or account to monitor.")
    ).toBeInTheDocument();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("clears the error after entering valid input", async () => {
    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Create Monitor"));

    expect(
      screen.getByText("Enter a topic, keyword, or account to monitor.")
    ).toBeInTheDocument();

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "Solana DePIN");
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });
});

/* ------------------------------------------------------------------ */
/*  MONITOR CREATION (API)                                            */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — monitor creation", () => {
  it("creates a topic monitor and resets the form", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder subscriptions={[]} onSubscriptionChange={onChange} />
    );
    await userEvent.click(screen.getByText("+ New Monitor"));

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "Ethereum L2");
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(
        "TOPIC",
        "Ethereum L2",
        ["in_app"]
      );
      expect(onChange).toHaveBeenCalled();
    });

    // Form should be hidden after creation
    expect(screen.queryByText("Create Monitor")).not.toBeInTheDocument();
  });

  it("creates a keyword monitor with joined keywords", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder subscriptions={[]} onSubscriptionChange={onChange} />
    );
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Keyword"));

    const input = screen.getByLabelText("Keyword");
    await userEvent.type(input, "ETH{Enter}");
    await userEvent.type(input, "gas fees{Enter}");
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(
        "KEYWORD",
        "ETH, gas fees",
        ["in_app"]
      );
    });
  });

  it("creates an account monitor", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder subscriptions={[]} onSubscriptionChange={onChange} />
    );
    await userEvent.click(screen.getByText("+ New Monitor"));
    await userEvent.click(screen.getByText("Account"));

    const input = screen.getByLabelText("X Handle");
    await userEvent.type(input, "@VitalikButerin");
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith(
        "ACCOUNT",
        "@VitalikButerin",
        ["in_app"]
      );
    });
  });

  it("shows error message when API fails", async () => {
    mockSubscribe.mockRejectedValueOnce(new Error("Network error"));

    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "MEV");
    await userEvent.click(screen.getByText("Create Monitor"));

    await waitFor(() => {
      expect(screen.getByText("Failed to create monitor.")).toBeInTheDocument();
    });
  });

  it("disables the button while creating", async () => {
    // Make subscribe hang
    mockSubscribe.mockReturnValue(new Promise(() => {}));

    renderBuilder();
    await userEvent.click(screen.getByText("+ New Monitor"));

    const topicInput = screen.getByLabelText("Topic");
    await userEvent.type(topicInput, "DeFi");
    await userEvent.click(screen.getByText("Create Monitor"));

    expect(screen.getByText("Creating...")).toBeInTheDocument();
    expect(screen.getByText("Creating...")).toBeDisabled();
  });
});

/* ------------------------------------------------------------------ */
/*  EXISTING MONITORS LIST                                            */
/* ------------------------------------------------------------------ */

describe("MonitorBuilder — existing monitors", () => {
  it("displays active monitor count", () => {
    renderBuilder([baseSub]);
    expect(screen.getByText("1 active monitor")).toBeInTheDocument();
  });

  it("pluralizes monitor count", () => {
    renderBuilder([
      baseSub,
      { ...baseSub, id: "sub-2", value: "Bitcoin ETF" },
    ]);
    expect(screen.getByText("2 active monitors")).toBeInTheDocument();
  });

  it("renders subscription details", () => {
    renderBuilder([baseSub]);
    expect(screen.getByText("Ethereum L2")).toBeInTheDocument();
    expect(screen.getByText("TOPIC")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText(/in_app/)).toBeInTheDocument();
  });

  it("shows Paused for inactive subscriptions", () => {
    renderBuilder([{ ...baseSub, isActive: false }]);
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("toggles a subscription on pause/resume click", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder
        subscriptions={[baseSub]}
        onSubscriptionChange={onChange}
      />
    );

    await userEvent.click(screen.getByLabelText("Pause monitor"));

    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith("sub-1");
      expect(onChange).toHaveBeenCalled();
    });
  });

  it("deletes a subscription", async () => {
    const onChange = jest.fn();
    render(
      <MonitorBuilder
        subscriptions={[baseSub]}
        onSubscriptionChange={onChange}
      />
    );

    await userEvent.click(screen.getByLabelText("Delete monitor"));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("sub-1");
      expect(onChange).toHaveBeenCalled();
    });
  });
});
