import {
  classifyFormat,
  recommendTiming,
  suggestAnalysts,
  buildStrategyBullets,
  type ContentFormat,
} from "@/lib/campaign-recommendations";

describe("classifyFormat", () => {
  it('returns "article" for content over 1200 characters', () => {
    const content = "a".repeat(1201);
    expect(classifyFormat(content)).toBe("article");
  });

  it('returns "article" when content contains "## "', () => {
    const content = "# Title\n\n## Section\n\nSome text";
    expect(classifyFormat(content)).toBe("article");
  });

  it('returns "thread" when content contains "\\n\\n1."', () => {
    const content = "Intro\n\n1. First point\n\n2. Second point";
    expect(classifyFormat(content)).toBe("thread");
  });

  it('returns "thread" when content contains "\\n\\n1/"', () => {
    const content = "Hook\n\n1/ First tweet\n\n2/ Second tweet";
    expect(classifyFormat(content)).toBe("thread");
  });

  it('returns "thread" when content has more than 2 paragraph breaks', () => {
    const content = "A\n\nB\n\nC\n\nD";
    expect(classifyFormat(content)).toBe("thread");
  });

  it('returns "one-liner" for short single-paragraph content', () => {
    const content = "Just a short tweet.";
    expect(classifyFormat(content)).toBe("one-liner");
  });
});

describe("recommendTiming", () => {
  it.each<[string, string, string]>([
    ["contrarian take", "Tuesday 10:00 AM EST", "Crypto Twitter peaks midweek mornings EST; contrarian takes generate most engagement then."],
    ["hot take", "Tuesday 10:00 AM EST", "Crypto Twitter peaks midweek mornings EST; contrarian takes generate most engagement then."],
    ["data highlight", "Wednesday 2:00 PM EST", "Data-heavy posts perform best midweek afternoons when readers have time to click."],
    ["prediction", "Sunday 6:00 PM EST", "Predictions about the week ahead land best Sunday evenings."],
    ["key finding", "Thursday 11:00 AM EST", "Core findings earn the most retweets midweek late-morning."],
  ])("for angle %s returns label %s", (angle, expectedLabel, expectedReason) => {
    const result = recommendTiming(angle, "one-liner");
    expect(result.label).toBe(expectedLabel);
    expect(result.reason).toBe(expectedReason);
  });

  it('defaults to "thread hook" timing for unknown angles', () => {
    const result = recommendTiming("unknown angle", "one-liner");
    expect(result.label).toBe("Tuesday 9:00 AM EST");
    expect(result.reason).toBe("Thread hooks get more follow-throughs in the morning.");
  });
});

describe("suggestAnalysts", () => {
  it("returns Anil for contrarian takes", () => {
    const result = suggestAnalysts("contrarian take", "one-liner");
    expect(result.map((r) => r.slug)).toContain("anil");
  });

  it("returns Kevin for data highlights", () => {
    const result = suggestAnalysts("data highlight", "one-liner");
    expect(result.map((r) => r.slug)).toContain("kevin");
  });

  it("returns Jonah for predictions", () => {
    const result = suggestAnalysts("prediction", "one-liner");
    expect(result.map((r) => r.slug)).toContain("jonah");
  });

  it("returns Ceteris for articles (format match)", () => {
    const result = suggestAnalysts("narrative arc", "article");
    expect(result.map((r) => r.slug)).toContain("ceteris");
  });

  it("returns exactly 2 analysts", () => {
    const result = suggestAnalysts("contrarian take", "one-liner");
    expect(result.length).toBe(2);
  });

  it("falls back to first 2 analysts when no match", () => {
    const result = suggestAnalysts("totally unknown", "one-liner");
    expect(result[0].slug).toBe("anil");
    expect(result[1].slug).toBe("kevin");
  });
});

describe("buildStrategyBullets", () => {
  it("builds bullets from draft angles", () => {
    const drafts = [
      { id: "1", content: "a", angle: "contrarian take", qualityScore: 80, discarded: false },
      { id: "2", content: "b", angle: "data highlight", qualityScore: 75, discarded: false },
      { id: "3", content: "c", angle: "prediction", qualityScore: 70, discarded: false },
    ];
    const bullets = buildStrategyBullets([], drafts as any);
    expect(bullets).toEqual([
      "1 contrarian take — lead with one Tuesday 10am EST",
      "1 data highlight — pair with chart, post Wed afternoon",
      "Save 1 prediction for Sunday evening",
    ]);
  });

  it("ignores discarded drafts", () => {
    const drafts = [
      { id: "1", content: "a", angle: "contrarian take", qualityScore: 80, discarded: true },
      { id: "2", content: "b", angle: "data highlight", qualityScore: 75, discarded: false },
    ];
    const bullets = buildStrategyBullets([], drafts as any);
    expect(bullets).toEqual([
      "1 data highlight — pair with chart, post Wed afternoon",
    ]);
  });

  it("returns fallback when no specific angles match", () => {
    const drafts = [
      { id: "1", content: "a", angle: "narrative arc", qualityScore: 80, discarded: false },
    ];
    const bullets = buildStrategyBullets([], drafts as any);
    expect(bullets).toEqual(["1 draft ready — review and schedule the top performers"]);
  });
});
