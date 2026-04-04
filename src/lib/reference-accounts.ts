import type { BlendVoiceInput, ReferenceAccount, ReferenceVoice } from "@/lib/api";

export type ReferenceAccountCategory =
  | "Crypto/VC"
  | "Macro"
  | "DeFi"
  | "Content"
  | "Culture"
  | "Tech"
  | "Philosophy";

export interface StoredReferenceSelection {
  ids: string[];
  weights: Record<string, number>;
  updatedAt: string;
}

type ReferenceAccountLike = Partial<ReferenceAccount> & {
  avatarUrl?: string | null;
  category?: string | null;
  displayName?: string | null;
  handle?: string | null;
  name?: string | null;
  profileImageUrl?: string | null;
};

const STORAGE_PREFIX = "atlas_reference_accounts";

export const REFERENCE_ACCOUNT_CATEGORY_ORDER: Array<
  "All" | ReferenceAccountCategory
> = [
  "All",
  "Crypto/VC",
  "Macro",
  "DeFi",
  "Content",
  "Culture",
  "Tech",
  "Philosophy",
];

export const REFERENCE_ACCOUNT_FALLBACK: ReferenceAccount[] = [
  {
    id: "hosseeb",
    handle: "hosseeb",
    displayName: "Haseeb Qureshi",
    category: "Crypto/VC",
  },
  {
    id: "DefiIgnas",
    handle: "DefiIgnas",
    displayName: "Ignas",
    category: "DeFi",
  },
  {
    id: "goodalexander",
    handle: "goodalexander",
    displayName: "Alex Good",
    category: "Macro",
  },
  {
    id: "thedankoe",
    handle: "thedankoe",
    displayName: "Dan Koe",
    category: "Content",
  },
  {
    id: "thiccyth0t",
    handle: "thiccyth0t",
    displayName: "thiccyth0t",
    category: "Culture",
  },
  {
    id: "ThinkingUSD",
    handle: "ThinkingUSD",
    displayName: "ThinkingUSD",
    category: "Macro",
  },
  {
    id: "JasonYanowitz",
    handle: "JasonYanowitz",
    displayName: "Jason Yanowitz",
    category: "Crypto/VC",
  },
  {
    id: "balaboris",
    handle: "balaboris",
    displayName: "Balaji",
    category: "Tech",
  },
  {
    id: "naval",
    handle: "naval",
    displayName: "Naval",
    category: "Philosophy",
  },
  {
    id: "elonmusk",
    handle: "elonmusk",
    displayName: "Elon Musk",
    category: "Culture",
  },
];

function normalizeHandle(value?: string | null) {
  return value?.trim().replace(/^@/, "") ?? "";
}

function isReferenceCategory(
  value: string | null | undefined
): value is ReferenceAccountCategory {
  return (
    value === "Crypto/VC" ||
    value === "Macro" ||
    value === "DeFi" ||
    value === "Content" ||
    value === "Culture" ||
    value === "Tech" ||
    value === "Philosophy"
  );
}

function getStorageKey(userId?: string) {
  return `${STORAGE_PREFIX}:${userId ?? "guest"}`;
}

function distributeEvenly(total: number, count: number) {
  if (count <= 0) {
    return [];
  }

  const base = Math.floor(total / count);
  const remainder = total - base * count;

  return Array.from({ length: count }, (_, index) =>
    index < remainder ? base + 1 : base
  );
}

export function normalizeReferenceAccount(
  account: ReferenceAccountLike
): ReferenceAccount {
  const handle = normalizeHandle(account.handle ?? account.id);
  const displayName =
    account.displayName?.trim() ||
    account.name?.trim() ||
    handle ||
    account.id ||
    "Unknown";
  const resolvedId = handle || account.id || displayName;
  const profileImageUrl = account.profileImageUrl ?? account.avatarUrl ?? null;

  return {
    id: resolvedId,
    handle,
    displayName,
    category: isReferenceCategory(account.category)
      ? account.category
      : "Crypto/VC",
    profileImageUrl,
    avatarUrl: profileImageUrl,
    name: displayName,
  };
}

export function normalizeReferenceAccounts(accounts: ReferenceAccountLike[] = []) {
  const deduped = new Map<string, ReferenceAccount>();

  for (const account of accounts) {
    const normalized = normalizeReferenceAccount(account);
    deduped.set(normalized.id, normalized);
  }

  return Array.from(deduped.values());
}

export function getReferenceAccountLookup(accounts: ReferenceAccount[]) {
  return new Map(accounts.map((account) => [account.id, account]));
}

export function readStoredReferenceSelection(userId?: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredReferenceSelection>;

    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter(Boolean) : [],
      weights:
        parsed.weights && typeof parsed.weights === "object"
          ? Object.fromEntries(
              Object.entries(parsed.weights).filter(
                ([key, value]) => Boolean(key) && typeof value === "number"
              )
            )
          : {},
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getEqualReferenceWeights(ids: string[]) {
  if (ids.length === 0) {
    return {};
  }

  const equalWeight = Number((1 / ids.length).toFixed(4));

  return Object.fromEntries(ids.map((id) => [id, equalWeight]));
}

export function writeStoredReferenceSelection(
  userId: string | undefined,
  ids: string[],
  weights: Record<string, number> = getEqualReferenceWeights(ids)
) {
  const selection: StoredReferenceSelection = {
    ids,
    weights,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(selection));
  }

  return selection;
}

export async function persistReferenceSelections(options: {
  userId?: string;
  ids: string[];
  weights?: Record<string, number>;
  saveRemote?: (
    userId: string,
    ids: string[],
    weights?: Record<string, number>
  ) => Promise<unknown>;
}) {
  const { ids, saveRemote, userId } = options;
  const weights = options.weights ?? getEqualReferenceWeights(ids);

  writeStoredReferenceSelection(userId, ids, weights);

  if (userId && saveRemote) {
    try {
      await saveRemote(userId, ids, weights);
    } catch {
      // Local cache keeps the flow working when the backend is unavailable.
    }
  }

  return { ids, weights };
}

export function mergeReferenceSelectionIds(
  ids: string[],
  references: ReferenceVoice[]
) {
  const merged = new Set(ids);

  for (const reference of references) {
    const normalizedId = normalizeHandle(reference.handle ?? reference.name ?? reference.id);

    if (normalizedId) {
      merged.add(normalizedId);
    }
  }

  return Array.from(merged);
}

export function buildReferenceBlendVoices(
  ids: string[],
  selfPercentage: number,
  accounts: ReferenceAccount[]
): BlendVoiceInput[] {
  const referencePercentages = distributeEvenly(
    Math.max(0, 100 - selfPercentage),
    ids.length
  );
  const lookup = getReferenceAccountLookup(accounts);

  return [
    { label: "My voice", percentage: selfPercentage },
    ...ids.map((id, index) => {
      const account = lookup.get(id);

      return {
        label: account?.displayName || account?.handle || `@${id}`,
        percentage: referencePercentages[index] ?? 0,
      };
    }),
  ];
}
