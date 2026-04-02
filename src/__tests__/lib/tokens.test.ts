import { colors, gradients } from "@/lib/tokens";

const COLOR_VALUE_PATTERN =
  /^(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\))$/;

describe("tokens.colors", () => {
  it.each(Object.entries(colors) as Array<[keyof typeof colors, string]>)(
    "defines %s as a valid hex or rgb color value",
    (_tokenName, tokenValue) => {
      expect(tokenValue).toMatch(COLOR_VALUE_PATTERN);
    }
  );

  it("includes glass presets for surface and border treatments", () => {
    expect(colors.glass).toBeDefined();
    expect(colors.glassBorder).toBeDefined();
    expect(colors.glass).toMatch(/^rgba\(/);
    expect(colors.glassBorder).toMatch(/^rgba\(/);
  });
});

describe("tokens.gradients", () => {
  it("defines the expected gradient presets", () => {
    expect(gradients).toEqual(
      expect.objectContaining({
        cta: expect.any(String),
        onboardingBg: expect.any(String),
      })
    );
  });

  it.each(Object.entries(gradients) as Array<[keyof typeof gradients, string]>)(
    "defines %s as a linear-gradient preset",
    (_tokenName, tokenValue) => {
      expect(tokenValue).toContain("linear-gradient");
    }
  );

  it("builds the CTA gradient from the teal and steel brand colors", () => {
    expect(gradients.cta).toContain(colors.atlasTeal);
    expect(gradients.cta).toContain(colors.atlasSteel);
  });
});
