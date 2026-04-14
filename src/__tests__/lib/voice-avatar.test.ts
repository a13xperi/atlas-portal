import { resolveVoiceAvatar, isSelfVoice, voiceInitials } from "@/lib/voice-avatar";

const makeVoice = (overrides: Partial<any> = {}) => ({
  id: "v1",
  label: "Test",
  percentage: 50,
  referenceVoiceId: null,
  referenceVoice: null,
  ...overrides,
});

describe("isSelfVoice", () => {
  it("true when explicit isSelf flag", () => {
    expect(isSelfVoice(makeVoice({ isSelf: true, referenceVoiceId: "x" }))).toBe(true);
  });
  it("true when no referenceVoice and no referenceVoiceId", () => {
    expect(isSelfVoice(makeVoice({ label: "whatever" }))).toBe(true);
  });
  it("true when label is 'My voice' even with referenceVoice attached (defensive)", () => {
    expect(
      isSelfVoice(
        makeVoice({ label: "My voice", referenceVoiceId: "ref", referenceVoice: { id: "ref", name: "X", handle: "foo", avatarUrl: "http://x" } })
      )
    ).toBe(true);
  });
  it("false for a normal inspiration", () => {
    expect(
      isSelfVoice(
        makeVoice({ label: "Hosseeb", referenceVoiceId: "r1", referenceVoice: { id: "r1", name: "Hosseeb", handle: "hosseeb", avatarUrl: "http://a" } })
      )
    ).toBe(false);
  });
});

describe("resolveVoiceAvatar", () => {
  const self = makeVoice({ label: "My voice" });
  const inspiration = makeVoice({
    label: "Hosseeb",
    referenceVoiceId: "r1",
    referenceVoice: { id: "r1", name: "Hosseeb", handle: "hosseeb", avatarUrl: "https://cdn/hosseeb.png" },
  });

  it("self + user.avatarUrl present → user avatar", () => {
    expect(resolveVoiceAvatar(self, { avatarUrl: "https://cdn/me.png", handle: "alex" })).toBe(
      "https://cdn/me.png"
    );
  });
  it("self + no avatarUrl but user.handle → unavatar by user handle", () => {
    expect(resolveVoiceAvatar(self, { handle: "@alex" })).toBe("https://unavatar.io/twitter/alex");
  });
  it("self + no user info → empty string (caller shows initials)", () => {
    expect(resolveVoiceAvatar(self, null)).toBe("");
  });
  it("self + user + inspiration-like referenceVoice on same slot → STILL returns user avatar", () => {
    const poisoned = makeVoice({
      label: "My voice",
      referenceVoiceId: "r1",
      referenceVoice: { id: "r1", name: "Hosseeb", handle: "hosseeb", avatarUrl: "https://cdn/hosseeb.png" },
    });
    expect(resolveVoiceAvatar(poisoned, { avatarUrl: "https://cdn/me.png", handle: "alex" })).toBe(
      "https://cdn/me.png"
    );
  });
  it("inspiration → referenceVoice.avatarUrl", () => {
    expect(resolveVoiceAvatar(inspiration, { avatarUrl: "https://cdn/me.png", handle: "alex" })).toBe(
      "https://cdn/hosseeb.png"
    );
  });
  it("inspiration with handle only → unavatar by referenceVoice handle", () => {
    const v = makeVoice({
      label: "Naval",
      referenceVoiceId: "r2",
      referenceVoice: { id: "r2", name: "Naval", handle: "naval" },
    });
    expect(resolveVoiceAvatar(v, { handle: "alex" })).toBe("https://unavatar.io/twitter/naval");
  });
});

describe("voiceInitials", () => {
  it("uses displayName for self", () => {
    expect(voiceInitials(makeVoice({ label: "My voice" }), { displayName: "Alex Peri" })).toBe("A");
  });
  it("uses voice.label for inspiration", () => {
    expect(
      voiceInitials(
        makeVoice({ label: "Hosseeb", referenceVoiceId: "r1", referenceVoice: { id: "r1", name: "H", handle: "h", avatarUrl: "x" } }),
        { displayName: "Alex" }
      )
    ).toBe("H");
  });
});
