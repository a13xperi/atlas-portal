import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  CommandPaletteProvider,
  useCommandPalette,
} from "@/components/ui/CommandPalette";

/* ─── Mocks ───────────────────────────────────────────────────────────────── */

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/demo-mode", () => ({
  useDemoMode: () => ({
    isDemoMode: false,
    toggleDemoMode: jest.fn(),
    setDemoModeQuiet: jest.fn(),
  }),
}));

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Trigger a keyboard event on the window. */
function pressKey(
  key: string,
  opts: Partial<KeyboardEvent> = {},
) {
  fireEvent.keyDown(window, { key, ...opts });
}

/** Open the palette via Cmd+K. */
function openPalette() {
  pressKey("k", { metaKey: true });
}

/** Render the provider with an optional trigger button that calls open(). */
function renderPalette() {
  function Trigger() {
    const { open } = useCommandPalette();
    return (
      <button data-testid="trigger" onClick={open}>
        Open
      </button>
    );
  }

  return render(
    <CommandPaletteProvider>
      <Trigger />
      <p>child content</p>
    </CommandPaletteProvider>,
  );
}

/* ─── localStorage stub ───────────────────────────────────────────────────── */

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

/* ─── Tests ───────────────────────────────────────────────────────────────── */

describe("CommandPalette", () => {
  beforeEach(() => {
    mockPush.mockReset();
    localStorageMock.clear();
  });

  /* ── Opening / Closing ───────────────────────────────────────────────── */

  describe("opening and closing", () => {
    it("is closed by default", () => {
      renderPalette();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens via Cmd+K", () => {
      renderPalette();
      act(() => openPalette());
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("opens via Ctrl+K", () => {
      renderPalette();
      act(() => pressKey("k", { ctrlKey: true }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("opens via the context open() method", () => {
      renderPalette();
      act(() => fireEvent.click(screen.getByTestId("trigger")));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes with Escape", () => {
      renderPalette();
      act(() => openPalette());
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      act(() => pressKey("Escape"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("toggles closed with Cmd+K when already open", () => {
      renderPalette();
      act(() => openPalette());
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      act(() => openPalette());
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes when clicking the backdrop", () => {
      renderPalette();
      act(() => openPalette());

      const backdrop = screen
        .getByRole("dialog")
        .querySelector(".absolute.inset-0");
      expect(backdrop).toBeInTheDocument();

      act(() => fireEvent.click(backdrop!));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders children regardless of palette state", () => {
      renderPalette();
      expect(screen.getByText("child content")).toBeInTheDocument();

      act(() => openPalette());
      expect(screen.getByText("child content")).toBeInTheDocument();
    });
  });

  /* ── Search Filtering ────────────────────────────────────────────────── */

  describe("search filtering", () => {
    it("shows all commands when no query is entered", () => {
      renderPalette();
      act(() => openPalette());

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Crafting Station")).toBeInTheDocument();
      expect(screen.getByText("Analytics")).toBeInTheDocument();
      expect(screen.getByText("Voice Lab")).toBeInTheDocument();
    });

    it("filters commands by label", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      act(() => fireEvent.change(input, { target: { value: "Dashboard" } }));

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Crafting Station")).not.toBeInTheDocument();
    });

    it("filters commands by description", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      act(() =>
        fireEvent.change(input, { target: { value: "Performance metrics" } }),
      );

      expect(screen.getByText("Analytics")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("filters commands by keywords", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      act(() => fireEvent.change(input, { target: { value: "tweet" } }));

      expect(screen.getByText("Crafting Station")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("is case-insensitive", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      act(() => fireEvent.change(input, { target: { value: "ANALYTICS" } }));

      expect(screen.getByText("Analytics")).toBeInTheDocument();
    });

    it("shows 'no results' message for unmatched query", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      act(() =>
        fireEvent.change(input, { target: { value: "xyznonexistent" } }),
      );

      expect(screen.getByRole("status")).toHaveTextContent(
        /no results for/i,
      );
    });
  });

  /* ── Keyboard Navigation ─────────────────────────────────────────────── */

  describe("keyboard navigation", () => {
    it("starts with the first item active", () => {
      renderPalette();
      act(() => openPalette());

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("moves down with ArrowDown", () => {
      renderPalette();
      act(() => openPalette());

      act(() => pressKey("ArrowDown"));

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
    });

    it("moves up with ArrowUp", () => {
      renderPalette();
      act(() => openPalette());

      // Move down twice, then up once
      act(() => pressKey("ArrowDown"));
      act(() => pressKey("ArrowDown"));
      act(() => pressKey("ArrowUp"));

      const options = screen.getAllByRole("option");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
    });

    it("does not go below the last item", () => {
      renderPalette();
      act(() => openPalette());

      const options = screen.getAllByRole("option");
      const count = options.length;

      // Press down more times than there are items
      for (let i = 0; i < count + 5; i++) {
        act(() => pressKey("ArrowDown"));
      }

      const refreshedOptions = screen.getAllByRole("option");
      expect(refreshedOptions[count - 1]).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("does not go above the first item", () => {
      renderPalette();
      act(() => openPalette());

      act(() => pressKey("ArrowUp"));

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("resets active index when search query changes", () => {
      renderPalette();
      act(() => openPalette());

      // Move down
      act(() => pressKey("ArrowDown"));
      act(() => pressKey("ArrowDown"));

      // Type a query — should reset to index 0
      const input = screen.getByRole("combobox");
      act(() => fireEvent.change(input, { target: { value: "alert" } }));

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("updates active item on mouse enter", () => {
      renderPalette();
      act(() => openPalette());

      const options = screen.getAllByRole("option");
      act(() => fireEvent.mouseEnter(options[2]));

      expect(options[2]).toHaveAttribute("aria-selected", "true");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
    });
  });

  /* ── Command Execution ───────────────────────────────────────────────── */

  describe("command execution", () => {
    it("navigates on Enter key for a navigation command", () => {
      renderPalette();
      act(() => openPalette());

      // First item is Dashboard — press Enter
      act(() => pressKey("Enter"));

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      // Palette should close after execution
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("navigates on click", () => {
      renderPalette();
      act(() => openPalette());

      act(() => fireEvent.click(screen.getByText("Analytics")));

      expect(mockPush).toHaveBeenCalledWith("/analytics");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("navigates to the correct route after keyboard selection", () => {
      renderPalette();
      act(() => openPalette());

      // Move to second item (Crafting Station)
      act(() => pressKey("ArrowDown"));
      act(() => pressKey("Enter"));

      expect(mockPush).toHaveBeenCalledWith("/crafting");
    });

    it("executes filtered command on Enter", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      act(() =>
        fireEvent.change(input, { target: { value: "Voice Lab" } }),
      );
      act(() => pressKey("Enter"));

      expect(mockPush).toHaveBeenCalledWith("/voice-profiles");
    });
  });

  /* ── Favorites ───────────────────────────────────────────────────────── */

  describe("favorites", () => {
    it("toggles a favorite via the star button", () => {
      renderPalette();
      act(() => openPalette());

      // Find the star button for Dashboard (first option group)
      const firstFavBtn = screen.getByRole("button", {
        name: /add dashboard to favorites/i,
      });
      act(() => fireEvent.click(firstFavBtn));

      // Dashboard now appears in Favorites + All Pages — both have "Remove" buttons
      const removeButtons = screen.getAllByRole("button", {
        name: /remove dashboard from favorites/i,
      });
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("shows a Favorites section when favorites exist", () => {
      // Pre-seed localStorage
      localStorageMock.setItem(
        "atlas:cmd:favorites",
        JSON.stringify(["analytics"]),
      );

      renderPalette();
      act(() => openPalette());

      expect(screen.getByText("Favorites")).toBeInTheDocument();
      expect(screen.getByText("All Pages")).toBeInTheDocument();
    });

    it("persists favorites to localStorage", () => {
      renderPalette();
      act(() => openPalette());

      const btn = screen.getByRole("button", {
        name: /add crafting station to favorites/i,
      });
      act(() => fireEvent.click(btn));

      const stored = JSON.parse(
        localStorageMock.getItem("atlas:cmd:favorites") ?? "[]",
      );
      expect(stored).toContain("crafting");
    });
  });

  /* ── Accessibility ───────────────────────────────────────────────────── */

  describe("accessibility", () => {
    it("sets role=dialog with aria-modal", () => {
      renderPalette();
      act(() => openPalette());

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-label", "Command palette");
    });

    it("has a combobox input with proper ARIA attributes", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      expect(input).toHaveAttribute("aria-controls");
    });

    it("has a listbox for results", () => {
      renderPalette();
      act(() => openPalette());

      expect(
        screen.getByRole("listbox", { name: "Commands" }),
      ).toBeInTheDocument();
    });

    it("sets aria-activedescendant on the combobox", () => {
      renderPalette();
      act(() => openPalette());

      const input = screen.getByRole("combobox");
      const activeDescId = input.getAttribute("aria-activedescendant");
      expect(activeDescId).toBeTruthy();

      // The referenced element should exist and be the first option
      const activeEl = document.getElementById(activeDescId!);
      expect(activeEl).toBeInTheDocument();
      expect(activeEl).toHaveAttribute("role", "option");
    });
  });
});
