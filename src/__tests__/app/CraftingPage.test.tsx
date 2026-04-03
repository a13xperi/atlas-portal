import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import CraftingPage from "@/app/crafting/page";
import { api } from "@/lib/api";

const mockUseAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/layout/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/lib/api", () => ({
  api: {
    drafts: {
      list: jest.fn(),
      generate: jest.fn(),
      update: jest.fn(),
      regenerate: jest.fn(),
      delete: jest.fn(),
      refine: jest.fn(),
    },
    analytics: {
      summary: jest.fn(),
    },
    voice: {
      getBlends: jest.fn(),
    },
    trending: {
      topics: jest.fn(),
    },
    images: {
      generateForDraft: jest.fn(),
    },
  },
}));

const mockedApi = api as {
  drafts: {
    list: jest.Mock;
    generate: jest.Mock;
    update: jest.Mock;
    regenerate: jest.Mock;
    delete: jest.Mock;
    refine: jest.Mock;
  };
  analytics: {
    summary: jest.Mock;
  };
  voice: {
    getBlends: jest.Mock;
  };
  trending: {
    topics: jest.Mock;
  };
  images: {
    generateForDraft: jest.Mock;
  };
};

describe("CraftingPage", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { handle: "AtlasAnalyst" },
    });

    mockedApi.drafts.list.mockReset();
    mockedApi.drafts.generate.mockReset();
    mockedApi.drafts.update.mockReset();
    mockedApi.drafts.regenerate.mockReset();
    mockedApi.drafts.delete.mockReset();
    mockedApi.drafts.refine.mockReset();
    mockedApi.analytics.summary.mockReset();
    mockedApi.voice.getBlends.mockReset();
    mockedApi.trending.topics.mockReset();
    mockedApi.images.generateForDraft.mockReset();

    mockedApi.drafts.list.mockResolvedValue({ drafts: [] });
    mockedApi.analytics.summary.mockResolvedValue({ summary: null });
    mockedApi.voice.getBlends.mockResolvedValue({ blends: [] });
    mockedApi.trending.topics.mockResolvedValue({ topics: [] });
    mockedApi.images.generateForDraft.mockResolvedValue({ image: null });
  });

  it("shows inline errors when trying to submit empty content", async () => {
    render(<CraftingPage />);

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Tweet idea input" }), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(await screen.findByText("Content is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Select at least one source before generating.")
    ).toBeInTheDocument();
    expect(mockedApi.drafts.generate).not.toHaveBeenCalled();
  });

  it("blocks submissions over 2000 characters", async () => {
    render(<CraftingPage />);

    const input = screen.getByRole("textbox", {
      name: "Tweet idea input",
    }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "a".repeat(2001) } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(
      await screen.findByText("Content must be under 2000 characters.")
    ).toBeInTheDocument();
    expect(mockedApi.drafts.generate).not.toHaveBeenCalled();
  });
});
