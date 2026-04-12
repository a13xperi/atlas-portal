import { synthesizeInspectorNarration } from "@/lib/oracle-narration";
import type { InspectableEntity } from "@/lib/oracle-agent-types";

describe("synthesizeInspectorNarration", () => {
  describe("unknown entity type", () => {
    it("returns a soft fallback for unrecognized types", () => {
      const entity: InspectableEntity = {
        type: "something_else" as InspectableEntity["type"],
        id: "x",
      };
      expect(synthesizeInspectorNarration("inspect", entity)).toBe(
        "Looking at this one\u2026",
      );
    });
  });

  // ── Draft narration ───────────────────────────────────────────────────

  describe("draft", () => {
    it("narrates a minimal draft with no meta", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d1",
      });
      expect(out).toBe("This one.");
    });

    it("uses entity name when provided", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d2",
        name: "v3 rewrite",
      });
      expect(out).toBe("This v3 rewrite.");
    });

    it("translates DRAFT status to human language", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d3",
        meta: { status: "DRAFT" },
      });
      expect(out).toContain("still a draft");
      // DRAFT status triggers a hook nudge
      expect(out).toContain("tighten the hook");
    });

    it("translates APPROVED status", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d4",
        meta: { status: "APPROVED" },
      });
      expect(out).toContain("approved and ready to ship");
      expect(out).toContain("Ready when you are");
    });

    it("translates POSTED status", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d5",
        meta: { status: "POSTED" },
      });
      expect(out).toContain("already live");
    });

    it("translates SCHEDULED status", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d6",
        meta: { status: "SCHEDULED" },
      });
      expect(out).toContain("queued up and waiting");
    });

    it("translates ARCHIVED status", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d7",
        meta: { status: "ARCHIVED" },
      });
      expect(out).toContain("parked in the archive");
    });

    it("warns when charCount exceeds 280", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d8",
        meta: { charCount: 320 },
      });
      expect(out).toContain("40 over the tweet limit");
      expect(out).toContain("needs a trim");
    });

    it("notes a tight fit when charCount is 240-280", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d9",
        meta: { charCount: 260 },
      });
      expect(out).toContain("tight fit at 260/280");
    });

    it("calls short drafts punchy", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d10",
        meta: { charCount: 80 },
      });
      expect(out).toContain("punchy at 80 characters");
    });

    it("calls mid-length drafts comfortable", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d11",
        meta: { charCount: 180 },
      });
      expect(out).toContain("180 characters, comfortable");
    });

    it("falls back to wordCount when charCount is absent", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d12",
        meta: { wordCount: 42 },
      });
      expect(out).toContain("42 words");
    });

    it("offers to queue when confidence >= 80%", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d13",
        meta: { confidence: 0.92 },
      });
      expect(out).toContain("92% confident");
      expect(out).toContain("queue it");
    });

    it("suggests refinement when confidence is 60-79%", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d14",
        meta: { confidence: 0.65 },
      });
      expect(out).toContain("65% confident");
      expect(out).toContain("refinement pass");
    });

    it("suggests collaboration when confidence is low", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d15",
        meta: { confidence: 0.3 },
      });
      expect(out).toContain("30% confident");
      expect(out).toContain("tighten the hook together");
    });

    it("uses score when confidence is absent (high)", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d16",
        meta: { score: 0.85 },
      });
      expect(out).toContain("Strong signal");
    });

    it("uses score when confidence is absent (mid)", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d17",
        meta: { score: 0.5 },
      });
      expect(out).toContain("Middle of the pack");
    });

    it("uses score when confidence is absent (low)", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d18",
        meta: { score: 0.2 },
      });
      expect(out).toContain("Soft signal");
    });

    it("prefers confidence over score when both present", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d19",
        meta: { confidence: 0.9, score: 0.1 },
      });
      expect(out).toContain("90% confident");
      expect(out).not.toContain("Soft signal");
    });

    it("combines status, charCount, and confidence", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "draft",
        id: "d20",
        name: "earnings take",
        meta: { status: "DRAFT", charCount: 200, confidence: 0.87 },
      });
      expect(out).toContain("This earnings take");
      expect(out).toContain("still a draft");
      expect(out).toContain("200 characters, comfortable");
      expect(out).toContain("87% confident");
    });
  });

  // ── Campaign narration ────────────────────────────────────────────────

  describe("campaign", () => {
    it("narrates a minimal campaign", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "campaign",
        id: "c1",
      });
      expect(out).toContain("this campaign");
      expect(out).toContain("line up the drafts");
    });

    it("uses entity name", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "campaign",
        id: "c2",
        name: "ETH Merge Thread",
      });
      expect(out).toContain("ETH Merge Thread");
    });

    it("includes topic when present", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "campaign",
        id: "c3",
        name: "L2 rollup recap",
        meta: { topic: "Layer 2 scaling" },
      });
      expect(out).toContain("on Layer 2 scaling");
    });

    it("includes note when present", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "campaign",
        id: "c4",
        meta: { note: "Needs review from Anil." },
      });
      expect(out).toContain("Needs review from Anil.");
    });
  });

  // ── Tweet narration ───────────────────────────────────────────────────

  describe("tweet", () => {
    it("uses authorName over authorHandle", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "tweet",
        id: "t1",
        meta: { authorName: "Hasu", authorHandle: "@hasufl" },
      });
      expect(out).toContain("Hasu's take");
      expect(out).not.toContain("@hasufl");
    });

    it("falls back to handle (stripped of @)", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "tweet",
        id: "t2",
        meta: { authorHandle: "@vitalikbuterin" },
      });
      expect(out).toContain("vitalikbuterin's take");
      expect(out).not.toContain("@");
    });

    it("uses generic wording when no author", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "tweet",
        id: "t3",
      });
      expect(out).toContain("this tweet");
    });

    it("includes topic when present", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "tweet",
        id: "t4",
        meta: { authorName: "Cobie", topic: "BTC dominance" },
      });
      expect(out).toContain("Cobie's take on BTC dominance");
      expect(out).toContain("pull it into your next draft");
    });

    it("offers voice weaving when no topic", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "tweet",
        id: "t5",
        meta: { authorName: "Hasu" },
      });
      expect(out).toContain("weave its angle into your voice");
    });
  });

  // ── Signal narration ────────────────────────────────���─────────────────

  describe("signal", () => {
    it("narrates with author and topic", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "signal",
        id: "s1",
        meta: { authorName: "Messari", topic: "DeFi yields" },
      });
      expect(out).toContain("Messari is surfacing DeFi yields");
      expect(out).toContain("tracking the space");
    });

    it("falls back to entity name for topic", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "signal",
        id: "s2",
        name: "ETH staking surge",
      });
      expect(out).toContain("ETH staking surge is trending");
      expect(out).toContain("draft a take");
    });

    it("uses generic wording for bare signal", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "signal",
        id: "s3",
        meta: { topic: "memecoin frenzy" },
      });
      expect(out).toContain("memecoin frenzy is trending");
    });

    it("prefers author handle (stripped) when no authorName", () => {
      const out = synthesizeInspectorNarration("inspect", {
        type: "signal",
        id: "s4",
        meta: { authorHandle: "@glassnode", topic: "on-chain flows" },
      });
      expect(out).toContain("glassnode is surfacing on-chain flows");
    });
  });

  // ── Tag parameter ───────────────────────────────────────────────────���─

  describe("tag parameter", () => {
    it("accepts 'observe' tag same as 'inspect'", () => {
      const entity: InspectableEntity = {
        type: "draft",
        id: "d-obs",
        meta: { status: "DRAFT" },
      };
      const inspect = synthesizeInspectorNarration("inspect", entity);
      const observe = synthesizeInspectorNarration("observe", entity);
      expect(inspect).toBe(observe);
    });
  });
});
