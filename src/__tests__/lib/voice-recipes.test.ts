import {
  buildBlendFingerprint,
  buildReferenceAccountLookup,
  getNotableVoiceDimensions,
  getVoiceDimensionLabel,
  isPersonalVoiceLabel,
  normalizeReferenceSelectionKey,
  resolveReferenceAccountForVoice,
} from "@/lib/voice-recipes";
import type { BlendVoice, ReferenceAccount, SavedBlend } from "@/lib/api";
import {
  DEFAULT_VOICE_DIMENSIONS,
  VOICE_DIMENSION_FIELDS,
  type VoiceDimensions,
} from "@/lib/voice-profile-dimensions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAccount(overrides: Partial<ReferenceAccount> = {}): ReferenceAccount {
  return {
    id: "acc-1",
    handle: "alice",
    displayName: "Alice",
    name: "alice",
    category: undefined,
    ...overrides,
  };
}

function makeBlendVoice(overrides: Partial<BlendVoice> = {}): BlendVoice {
  return {
    id: "v-1",
    label: "alice",
    percentage: 50,
    referenceVoice: null,
    ...overrides,
  };
}

function makeBlend(voices: BlendVoice[], name = "Test blend"): SavedBlend {
  return { id: "blend-1", name, voices };
}

const ALL_NEUTRAL: VoiceDimensions = { ...DEFAULT_VOICE_DIMENSIONS };

// ---------------------------------------------------------------------------
// normalizeReferenceSelectionKey
// ---------------------------------------------------------------------------

describe("normalizeReferenceSelectionKey", () => {
  it("lowercases and trims whitespace", () => {
    expect(normalizeReferenceSelectionKey("  Alice  ")).toBe("alice");
  });

  it("strips leading @ symbol", () => {
    expect(normalizeReferenceSelectionKey("@Alice")).toBe("alice");
  });

  it("returns empty string for null/undefined", () => {
    expect(normalizeReferenceSelectionKey(null)).toBe("");
    expect(normalizeReferenceSelectionKey(undefined)).toBe("");
  });

  it("handles empty string input", () => {
    expect(normalizeReferenceSelectionKey("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// isPersonalVoiceLabel
// ---------------------------------------------------------------------------

describe("isPersonalVoiceLabel", () => {
  it.each(["personal", "Personal", "PERSONAL", "personal voice", "my voice"])(
    "returns true for '%s'",
    (label) => {
      expect(isPersonalVoiceLabel(label)).toBe(true);
    }
  );

  it("returns false for non-personal labels", () => {
    expect(isPersonalVoiceLabel("alice")).toBe(false);
    expect(isPersonalVoiceLabel("@cobie")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isPersonalVoiceLabel(null)).toBe(false);
    expect(isPersonalVoiceLabel(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildReferenceAccountLookup
// ---------------------------------------------------------------------------

describe("buildReferenceAccountLookup", () => {
  it("indexes accounts by id, handle, displayName, and name", () => {
    const account = makeAccount({
      id: "acc-1",
      handle: "bob",
      displayName: "Bob Builder",
      name: "bobby",
    });
    const lookup = buildReferenceAccountLookup([account]);

    expect(lookup.get("acc-1")).toBe(account);
    expect(lookup.get("bob")).toBe(account);
    expect(lookup.get("bob builder")).toBe(account);
    expect(lookup.get("bobby")).toBe(account);
  });

  it("handles multiple accounts without collision when keys differ", () => {
    const a = makeAccount({ id: "a1", handle: "alpha", name: "alpha-name" });
    const b = makeAccount({ id: "b1", handle: "bravo", name: "bravo-name" });
    const lookup = buildReferenceAccountLookup([a, b]);

    expect(lookup.get("alpha")).toBe(a);
    expect(lookup.get("bravo")).toBe(b);
  });

  it("skips null/undefined keys", () => {
    const account = makeAccount({
      id: "acc-1",
      handle: undefined,
      displayName: undefined,
      name: undefined,
    });
    const lookup = buildReferenceAccountLookup([account]);

    expect(lookup.get("acc-1")).toBe(account);
    expect(lookup.size).toBe(1);
  });

  it("returns empty map for empty array", () => {
    const lookup = buildReferenceAccountLookup([]);
    expect(lookup.size).toBe(0);
  });

  it("later account wins when keys collide", () => {
    const first = makeAccount({ id: "shared", handle: "shared" });
    const second = makeAccount({ id: "shared", handle: "shared" });
    const lookup = buildReferenceAccountLookup([first, second]);
    expect(lookup.get("shared")).toBe(second);
  });
});

// ---------------------------------------------------------------------------
// getVoiceDimensionLabel
// ---------------------------------------------------------------------------

describe("getVoiceDimensionLabel", () => {
  it("returns the human-readable label for known fields", () => {
    expect(getVoiceDimensionLabel("humor")).toBe("Humor");
    expect(getVoiceDimensionLabel("technicalDepth")).toBe("Technical depth");
    expect(getVoiceDimensionLabel("contrarianTone")).toBe("Contrarian tone");
    expect(getVoiceDimensionLabel("selfPromotionalIntensity")).toBe(
      "Self-promotional intensity"
    );
  });

  it("falls back to the raw field name for unknown fields", () => {
    // Cast to bypass type safety for edge case test
    expect(getVoiceDimensionLabel("unknownField" as never)).toBe("unknownField");
  });
});

// ---------------------------------------------------------------------------
// getNotableVoiceDimensions
// ---------------------------------------------------------------------------

describe("getNotableVoiceDimensions", () => {
  it("returns top-N dimensions by distance from neutral (50)", () => {
    const dims: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 90, // delta 40
      formality: 10, // delta 40
      brevity: 70, // delta 20
      contrarianTone: 80, // delta 30
      directness: 55, // delta 5
    };

    const result = getNotableVoiceDimensions(dims, 3);
    expect(result).toHaveLength(3);
    expect(result[0].deltaFromNeutral).toBeGreaterThanOrEqual(
      result[1].deltaFromNeutral
    );
    expect(result[1].deltaFromNeutral).toBeGreaterThanOrEqual(
      result[2].deltaFromNeutral
    );
  });

  it("defaults to 5 results", () => {
    const dims: VoiceDimensions = {
      humor: 90,
      formality: 10,
      brevity: 80,
      contrarianTone: 20,
      directness: 85,
      warmth: 15,
      technicalDepth: 75,
      confidence: 25,
      evidenceOrientation: 70,
      solutionOrientation: 30,
      socialPosture: 65,
      selfPromotionalIntensity: 35,
    };

    expect(getNotableVoiceDimensions(dims)).toHaveLength(5);
  });

  it("includes correct label, value, and deltaFromNeutral", () => {
    const dims: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 90,
    };

    const result = getNotableVoiceDimensions(dims, 1);
    expect(result[0]).toEqual({
      field: "humor",
      label: "Humor",
      value: 90,
      deltaFromNeutral: 40,
    });
  });

  it("handles all-neutral dimensions (all deltas zero)", () => {
    const result = getNotableVoiceDimensions(DEFAULT_VOICE_DIMENSIONS, 3);
    expect(result).toHaveLength(3);
    result.forEach((snap) => expect(snap.deltaFromNeutral).toBe(0));
  });

  it("returns fewer items when count exceeds total fields", () => {
    const result = getNotableVoiceDimensions(DEFAULT_VOICE_DIMENSIONS, 50);
    expect(result).toHaveLength(VOICE_DIMENSION_FIELDS.length);
  });
});

// ---------------------------------------------------------------------------
// buildBlendFingerprint
// ---------------------------------------------------------------------------

describe("buildBlendFingerprint", () => {
  it("returns personal dimensions for a single personal voice at 100%", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 80,
      formality: 20,
    };
    const blend = makeBlend([makeBlendVoice({ label: "personal", percentage: 100 })]);

    const result = buildBlendFingerprint(blend, personal, []);

    expect(result.humor).toBe(80);
    expect(result.formality).toBe(20);
  });

  it("blends two voices by weight", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 100,
    };
    const refAccount = makeAccount({ id: "ref-1", handle: "researcher", category: "researcher" });
    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 50 }),
      makeBlendVoice({ label: "researcher", percentage: 50 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, [refAccount]);

    // personal humor=100, researcher preset humor=50 (default). Blend = (100*0.5 + 50*0.5) = 75
    expect(result.humor).toBe(75);
  });

  it("uses category dimensions for a categorized reference account", () => {
    const account = makeAccount({ id: "acc-1", handle: "bob", category: "trader" });
    const blend = makeBlend([
      makeBlendVoice({ label: "bob", percentage: 100 }),
    ]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, [account]);

    // Trader preset has brevity: 74
    expect(result.brevity).toBe(74);
    // Trader preset has confidence: 86
    expect(result.confidence).toBe(86);
  });

  it("falls back to label pattern matching when no category", () => {
    const account = makeAccount({ id: "acc-1", handle: "megashitposter", category: undefined });
    const blend = makeBlend([
      makeBlendVoice({ label: "megashitposter", percentage: 100 }),
    ]);

    // Label "megashitposter" does not match any LABEL_DIMENSION_RULES pattern
    // because the label is checked on the blend voice label, not the account handle.
    // Let's use a label that does match:
    const blend2 = makeBlend([
      makeBlendVoice({ label: "shitposter mode", percentage: 100 }),
    ]);

    const result = buildBlendFingerprint(blend2, ALL_NEUTRAL, []);

    // shitposter preset has humor: 88
    expect(result.humor).toBe(88);
    // shitposter preset has formality: 18
    expect(result.formality).toBe(18);
  });

  it("falls back to DEFAULT_VOICE_DIMENSIONS when no category and no label match", () => {
    const account = makeAccount({ id: "acc-1", handle: "random", category: undefined });
    const blend = makeBlend([
      makeBlendVoice({ label: "random", percentage: 100 }),
    ]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, [account]);

    VOICE_DIMENSION_FIELDS.forEach((field) => {
      expect(result[field]).toBe(DEFAULT_VOICE_DIMENSIONS[field]);
    });
  });

  it("treats negative percentages as zero weight", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 100,
    };
    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: -10 }),
      makeBlendVoice({ label: "personal", percentage: 50 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, []);

    // -10 is clamped to 0, so only the second voice (50) matters: 100%
    expect(result.humor).toBe(100);
  });

  it("defaults to totalWeight of 100 when all percentages are zero", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 80,
    };
    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 0 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, []);

    // weight = max(0,0)/100 = 0 for each voice, so all fields stay at 0 → clamped/rounded
    VOICE_DIMENSION_FIELDS.forEach((field) => {
      expect(result[field]).toBe(0);
    });
  });

  it("resolves reference via explicit referenceVoice.id", () => {
    const account = makeAccount({ id: "acc-99", handle: "someone", category: "defi" });
    const blend = makeBlend([
      makeBlendVoice({
        label: "unrelated label",
        percentage: 100,
        referenceVoice: { id: "acc-99", name: "Someone", isActive: true },
      }),
    ]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, [account]);

    // DeFi preset has technicalDepth: 82
    expect(result.technicalDepth).toBe(82);
  });

  it("resolves reference via explicit referenceVoice.handle", () => {
    const account = makeAccount({ id: "acc-99", handle: "defi-guru", category: "defi" });
    const blend = makeBlend([
      makeBlendVoice({
        label: "unrelated",
        percentage: 100,
        referenceVoice: { id: "unknown-id", name: "DeFi Guru", handle: "defi-guru", isActive: true },
      }),
    ]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, [account]);

    expect(result.technicalDepth).toBe(82);
  });

  it("resolves reference via explicit referenceVoice.name", () => {
    const account = makeAccount({ id: "acc-99", handle: "foo", name: "defi queen", category: "defi" });
    const blend = makeBlend([
      makeBlendVoice({
        label: "unrelated",
        percentage: 100,
        referenceVoice: { id: "unknown", name: "defi queen", isActive: true },
      }),
    ]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, [account]);

    expect(result.technicalDepth).toBe(82);
  });

  it("handles three-way blend with unequal weights", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 100,
    };
    const traderAccount = makeAccount({ id: "t1", handle: "trader1", category: "trader" });
    const contentAccount = makeAccount({ id: "c1", handle: "creator1", category: "content" });

    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 50 }),
      makeBlendVoice({ label: "trader1", percentage: 30 }),
      makeBlendVoice({ label: "creator1", percentage: 20 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, [
      traderAccount,
      contentAccount,
    ]);

    // humor: personal=100*0.5 + trader=50*0.3 + content=78*0.2 = 50+15+15.6 = 80.6 → 81
    expect(result.humor).toBe(81);
  });

  it("returns clamped integer dimensions (0-100)", () => {
    const extreme: VoiceDimensions = VOICE_DIMENSION_FIELDS.reduce(
      (acc, field) => ({ ...acc, [field]: 100 }),
      {} as VoiceDimensions
    );
    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 100 }),
    ]);

    const result = buildBlendFingerprint(blend, extreme, []);

    VOICE_DIMENSION_FIELDS.forEach((field) => {
      expect(result[field]).toBeGreaterThanOrEqual(0);
      expect(result[field]).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result[field])).toBe(true);
    });
  });

  it("matches label rules in priority order", () => {
    // "alpha trader" matches both "trader" rule and could partially match others.
    // LABEL_DIMENSION_RULES processes in order: researcher > trader > shitposter > tech > philosophy
    // "alpha trader" matches the trader pattern (trader|macro|gcr|pento|alpha)
    const blend = makeBlend([
      makeBlendVoice({ label: "alpha trader", percentage: 100 }),
    ]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, []);

    // "alpha" matches the trader rule first in LABEL_DIMENSION_RULES
    // trader preset: confidence=86
    expect(result.confidence).toBe(86);
  });
});

// ---------------------------------------------------------------------------
// Blend normalization
// ---------------------------------------------------------------------------

describe("blend normalization", () => {
  it("normalizes blend percentages that sum to >100", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 100,
      formality: 20,
    };
    const refAccount = makeAccount({ id: "ref-1", handle: "researcher", category: "researcher" });
    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 80 }),
      makeBlendVoice({ label: "researcher", percentage: 80 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, [refAccount]);

    // totalWeight = 160, each weight = 80/160 = 0.5
    // personal humor=100, researcher preset humor=50 (default)
    // personal humor=100, researcher preset humor=50 (default)
    // Blend = (100*0.5 + 50*0.5) = 75
    expect(result.humor).toBe(75);
    // researcher preset formality=76
    expect(result.formality).toBe(48); // (20*0.5 + 76*0.5) = 48
  });

  it("normalizes blend percentages that sum to <100", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 100,
      formality: 20,
    };
    const refAccount = makeAccount({ id: "ref-1", handle: "researcher", category: "researcher" });
    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 25 }),
      makeBlendVoice({ label: "researcher", percentage: 25 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, [refAccount]);

    // totalWeight = 50, each weight = 25/50 = 0.5
    // Blend = (100*0.5 + 50*0.5) = 75
    expect(result.humor).toBe(75);
    // researcher preset formality=76
    expect(result.formality).toBe(48); // (20*0.5 + 76*0.5) = 48
  });

  it("handles empty blend array gracefully", () => {
    const blend = makeBlend([]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, []);

    VOICE_DIMENSION_FIELDS.forEach((field) => {
      expect(result[field]).toBe(0);
    });
  });

  it("single voice blend stays at 100% regardless of percentage value", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 80,
      formality: 30,
    };
    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 42 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, []);

    // totalWeight = 42, weight = 42/42 = 1
    expect(result.humor).toBe(80);
    expect(result.formality).toBe(30);
  });

  it("three voice blend produces correct proportions", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 90,
    };
    const traderAccount = makeAccount({ id: "t1", handle: "trader1", category: "trader" });
    const contentAccount = makeAccount({ id: "c1", handle: "creator1", category: "content" });

    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 100 }),
      makeBlendVoice({ label: "trader1", percentage: 100 }),
      makeBlendVoice({ label: "creator1", percentage: 100 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, [
      traderAccount,
      contentAccount,
    ]);

    // totalWeight = 300, each weight = 100/300 = 1/3
    // humor: personal=90*1/3 + trader=50*1/3 + content=78*1/3 = 30 + 16.667 + 26 = 72.667 → 73
    expect(result.humor).toBe(73);
  });

  it("three voice blend with unequal weights sums correctly", () => {
    const personal: VoiceDimensions = {
      ...DEFAULT_VOICE_DIMENSIONS,
      humor: 100,
    };
    const refAccount = makeAccount({ id: "ref-1", handle: "researcher", category: "researcher" });

    const blend = makeBlend([
      makeBlendVoice({ label: "personal", percentage: 60 }),
      makeBlendVoice({ label: "researcher", percentage: 30 }),
      makeBlendVoice({ label: "personal", percentage: 10 }),
    ]);

    const result = buildBlendFingerprint(blend, personal, [refAccount]);

    // totalWeight = 100
    // humor: personal=100*0.6 + researcher=50*0.3 + personal=100*0.1 = 60 + 15 + 10 = 85
    expect(result.humor).toBe(85);
  });
});

// ---------------------------------------------------------------------------
// resolveReferenceAccountForVoice
// ---------------------------------------------------------------------------

describe("resolveReferenceAccountForVoice", () => {
  it("returns null for personal voice labels", () => {
    const lookup = buildReferenceAccountLookup([makeAccount()]);
    expect(
      resolveReferenceAccountForVoice({ label: "personal", referenceVoice: null }, lookup)
    ).toBeNull();
    expect(
      resolveReferenceAccountForVoice({ label: "my voice", referenceVoice: null }, lookup)
    ).toBeNull();
  });

  it("resolves via referenceVoice.id", () => {
    const account = makeAccount({ id: "acc-1" });
    const lookup = buildReferenceAccountLookup([account]);

    const result = resolveReferenceAccountForVoice(
      { label: "whatever", referenceVoice: { id: "acc-1", name: "A", isActive: true } },
      lookup
    );

    expect(result).toBe(account);
  });

  it("resolves via referenceVoice.handle", () => {
    const account = makeAccount({ id: "acc-1", handle: "alice" });
    const lookup = buildReferenceAccountLookup([account]);

    const result = resolveReferenceAccountForVoice(
      {
        label: "whatever",
        referenceVoice: { id: "unknown", name: "A", handle: "alice", isActive: true },
      },
      lookup
    );

    expect(result).toBe(account);
  });

  it("resolves via referenceVoice.name", () => {
    const account = makeAccount({ id: "acc-1", name: "alice" });
    const lookup = buildReferenceAccountLookup([account]);

    const result = resolveReferenceAccountForVoice(
      {
        label: "whatever",
        referenceVoice: { id: "unknown", name: "alice", isActive: true },
      },
      lookup
    );

    expect(result).toBe(account);
  });

  it("falls back to voice label", () => {
    const account = makeAccount({ id: "acc-1", handle: "bob" });
    const lookup = buildReferenceAccountLookup([account]);

    const result = resolveReferenceAccountForVoice(
      { label: "bob", referenceVoice: null },
      lookup
    );

    expect(result).toBe(account);
  });

  it("returns null when nothing matches", () => {
    const lookup = buildReferenceAccountLookup([makeAccount({ id: "acc-1", handle: "alice" })]);

    const result = resolveReferenceAccountForVoice(
      { label: "unknown", referenceVoice: null },
      lookup
    );

    expect(result).toBeNull();
  });

  it("returns null for empty lookup map", () => {
    const lookup = buildReferenceAccountLookup([]);

    const result = resolveReferenceAccountForVoice(
      { label: "alice", referenceVoice: null },
      lookup
    );

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// LABEL_DIMENSION_RULES edge cases
// ---------------------------------------------------------------------------

describe("label-based dimension matching", () => {
  it.each([
    ["research thread", "researcher"],
    ["Top analyst picks", "researcher"],
    ["alpha calls", "trader"],
    ["macro outlook", "trader"],
    ["shitpost compilation", "shitposter"],
    ["degen hour", "shitposter"],
    ["builder diary", "tech"],
    ["dev log #12", "tech"],
    ["philosophy corner", "philosophy"],
    ["naval thoughts", "philosophy"],
  ])("label '%s' resolves to '%s' category preset", (label, _category) => {
    const blend = makeBlend([makeBlendVoice({ label, percentage: 100 })]);
    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, []);

    // Just verify we don't get all-50 (default) — the label rule matched something
    const hasNonDefault = VOICE_DIMENSION_FIELDS.some(
      (f) => result[f] !== DEFAULT_VOICE_DIMENSIONS[f]
    );
    expect(hasNonDefault).toBe(true);
  });

  it("unmatched labels yield default dimensions", () => {
    const blend = makeBlend([
      makeBlendVoice({ label: "cooking tips", percentage: 100 }),
    ]);
    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, []);

    VOICE_DIMENSION_FIELDS.forEach((field) => {
      expect(result[field]).toBe(DEFAULT_VOICE_DIMENSIONS[field]);
    });
  });
});

// ---------------------------------------------------------------------------
// CATEGORY_DIMENSIONS coverage
// ---------------------------------------------------------------------------

describe("category dimension presets", () => {
  const categories = [
    "crypto/vc",
    "macro",
    "defi",
    "content",
    "culture",
    "tech",
    "philosophy",
    "researcher",
    "trader",
    "shitposter",
  ];

  it.each(categories)("'%s' category produces non-default dimensions", (category) => {
    const account = makeAccount({ id: `cat-${category}`, handle: `cat-${category}`, category });
    const blend = makeBlend([
      makeBlendVoice({ label: `cat-${category}`, percentage: 100 }),
    ]);

    const result = buildBlendFingerprint(blend, ALL_NEUTRAL, [account]);

    const hasNonDefault = VOICE_DIMENSION_FIELDS.some(
      (f) => result[f] !== DEFAULT_VOICE_DIMENSIONS[f]
    );
    expect(hasNonDefault).toBe(true);
  });
});
