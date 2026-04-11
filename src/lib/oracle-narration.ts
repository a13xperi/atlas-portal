import type { InspectableEntity } from "./oracle-agent-types";

/**
 * Local narration synthesis for OracleInspector.
 *
 * Human-first framing rules (Anil Apr 2026 directive):
 *   - Speak in concrete outcomes, not raw numbers. "drops 14 words" beats
 *     "delta: -14". "87% confident" beats "score: 0.87".
 *   - Prefer names (Hasu) over handles (@hasufl). Fall back to the handle
 *     only when no display name is known.
 *   - Never surface enum labels (DRAFT, APPROVED, POSTED). Translate to
 *     plain verbs ("this one's still a draft", "ready to ship").
 *   - Each line ends with a light nudge the user can act on — "Want me
 *     to tighten the hook?" — so the narration invites engagement.
 *
 * The synth is deterministic for a given entity fingerprint so tests can
 * snapshot specific lines. When the entity has too little context, we
 * fall back to a soft "looking at this one" line rather than making
 * something up.
 */
export function synthesizeInspectorNarration(
  _tag: "inspect" | "observe",
  entity: InspectableEntity,
): string {
  const meta = entity.meta ?? {};

  switch (entity.type) {
    case "draft":
      return narrateDraft(entity, meta);
    case "campaign":
      return narrateCampaign(entity, meta);
    case "tweet":
      return narrateTweet(entity, meta);
    case "signal":
      return narrateSignal(entity, meta);
    default:
      return "Looking at this one…";
  }
}

function pickName(meta: InspectableEntity["meta"]): string | null {
  if (!meta) return null;
  if (meta.authorName && meta.authorName.trim()) return meta.authorName.trim();
  if (meta.authorHandle && meta.authorHandle.trim()) {
    // Strip leading @ so the Oracle reads it as a name-ish reference
    // instead of leaking a handle shape into the copy.
    return meta.authorHandle.replace(/^@/, "").trim();
  }
  return null;
}

function humanStatus(status?: string): string | null {
  if (!status) return null;
  const s = status.toUpperCase();
  if (s === "DRAFT") return "still a draft";
  if (s === "APPROVED") return "approved and ready to ship";
  if (s === "POSTED") return "already live";
  if (s === "SCHEDULED") return "queued up and waiting";
  if (s === "ARCHIVED") return "parked in the archive";
  return null;
}

function narrateDraft(
  entity: InspectableEntity,
  meta: NonNullable<InspectableEntity["meta"]>,
): string {
  const parts: string[] = [];

  const name = entity.name ? `This ${entity.name}` : "This one";
  parts.push(name);

  const statusPhrase = humanStatus(meta.status);
  if (statusPhrase) parts.push(`is ${statusPhrase}`);

  if (typeof meta.charCount === "number") {
    const char = meta.charCount;
    if (char > 280) {
      parts.push(`— ${char - 280} over the tweet limit, needs a trim`);
    } else if (char > 240) {
      parts.push(`— tight fit at ${char}/280, not much room to breathe`);
    } else if (char < 120) {
      parts.push(`— punchy at ${char} characters`);
    } else {
      parts.push(`— ${char} characters, comfortable`);
    }
  } else if (typeof meta.wordCount === "number") {
    parts.push(`— ${meta.wordCount} words`);
  }

  const head = parts.join(" ").replace(/\s+,/g, ",").trim() + ".";

  // A second sentence with confidence + nudge. We only speak about
  // confidence when we have it, because "unknown confidence" reads worse
  // than saying nothing.
  let nudge = "";
  if (typeof meta.confidence === "number") {
    const pct = Math.round(meta.confidence * 100);
    if (pct >= 80) {
      nudge = ` ${pct}% confident this lands — want me to queue it?`;
    } else if (pct >= 60) {
      nudge = ` ${pct}% confident — worth a refinement pass first.`;
    } else {
      nudge = ` Only ${pct}% confident — let's tighten the hook together.`;
    }
  } else if (typeof meta.score === "number") {
    // Score is a 0-1 composite — translate to a plain description.
    const pct = Math.round(meta.score * 100);
    if (pct >= 70) nudge = ` Strong signal — worth prioritizing.`;
    else if (pct >= 40) nudge = ` Middle of the pack — a refinement could push it higher.`;
    else nudge = ` Soft signal — might be worth reshaping or archiving.`;
  } else if (meta.status?.toUpperCase() === "DRAFT") {
    nudge = " Want me to tighten the hook or shorten it?";
  } else if (meta.status?.toUpperCase() === "APPROVED") {
    nudge = " Ready when you are — say the word and I'll queue it.";
  }

  return (head + nudge).trim();
}

function narrateCampaign(
  entity: InspectableEntity,
  meta: NonNullable<InspectableEntity["meta"]>,
): string {
  const label = entity.name || "this campaign";
  const topic = meta.topic ? ` on ${meta.topic}` : "";
  const note = meta.note ? ` ${meta.note}` : "";
  return `Looking at ${label}${topic}.${note} Want me to line up the drafts in order?`.trim();
}

function narrateTweet(
  entity: InspectableEntity,
  meta: NonNullable<InspectableEntity["meta"]>,
): string {
  const name = pickName(meta);
  const attribution = name ? `${name}'s take` : "this tweet";
  if (meta.topic) {
    return `${attribution} on ${meta.topic} — want me to pull it into your next draft as a reference?`;
  }
  return `${attribution} — I can weave its angle into your voice if it resonates.`;
}

function narrateSignal(
  entity: InspectableEntity,
  meta: NonNullable<InspectableEntity["meta"]>,
): string {
  const topic = meta.topic || entity.name || "this signal";
  const author = pickName(meta);
  if (author) {
    return `${author} is surfacing ${topic} — worth a monitor if you're tracking the space.`;
  }
  return `${topic} is trending in your space — want me to draft a take?`;
}
