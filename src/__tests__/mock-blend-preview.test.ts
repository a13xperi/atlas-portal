import { DEFAULT_VOICE_DIMENSIONS } from "@/lib/voice-profile-dimensions";
import { generateMockBlendPreview } from "@/lib/mock-blend-preview";

const PROMPTS = [
  "ETH rally to 4k",
  "Rollup TPS comparison",
  "Why L2s matter for adoption",
];

describe("generateMockBlendPreview", () => {
  it("returns deterministic output for the same input", () => {
    const blend = {
      voices: [
        { handle: "atlas", percentage: 60 },
        { handle: "hasufl", percentage: 40 },
      ],
      dimensions: { ...DEFAULT_VOICE_DIMENSIONS, humor: 78, technicalDepth: 72 },
    };

    expect(generateMockBlendPreview(blend, PROMPTS)).toEqual(
      generateMockBlendPreview(blend, PROMPTS)
    );
  });

  it("returns one preview per prompt", () => {
    const result = generateMockBlendPreview(
      {
        voices: [{ handle: "atlas", percentage: 100 }],
        dimensions: DEFAULT_VOICE_DIMENSIONS,
      },
      PROMPTS
    );

    expect(result.mode).toBe("mock");
    expect(result.tweets).toHaveLength(3);
    expect(result.tweets.map((tweet) => tweet.prompt)).toEqual(PROMPTS);
  });

  it("changes flavor text when dimensions change", () => {
    const humorous = generateMockBlendPreview(
      {
        voices: [{ handle: "atlas", percentage: 100 }],
        dimensions: { ...DEFAULT_VOICE_DIMENSIONS, humor: 92, formality: 12 },
      },
      PROMPTS
    );
    const formal = generateMockBlendPreview(
      {
        voices: [{ handle: "atlas", percentage: 100 }],
        dimensions: { ...DEFAULT_VOICE_DIMENSIONS, humor: 8, formality: 92 },
      },
      PROMPTS
    );

    expect(humorous.tweets[0].text).not.toEqual(formal.tweets[0].text);
    expect(humorous.tweets[0].text).toMatch(
      /Chart goblin take:|Timeline take:|Low-key take:/
    );
    expect(formal.tweets[0].text).toMatch(
      /Base case:|Working view:|Read-through:/
    );
  });
});
