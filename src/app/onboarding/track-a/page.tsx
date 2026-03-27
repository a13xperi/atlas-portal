"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "@/components/layout/OnboardingShell";
import ProgressBar from "@/components/ui/ProgressBar";
import DimensionBar from "@/components/ui/DimensionBar";
import GradientButton from "@/components/ui/GradientButton";
import { ThumbsUp, ThumbsDown, Mic, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const sampleTweets = [
  { text: "ETH staking yields are compressing fast. The easy alpha is gone — now it's about execution risk and DVT adoption.", dims: { humor: -5, formality: 5, brevity: 5, contrarianTone: 10 } },
  { text: "Everyone's talking about L2 fees but nobody's asking why L1 gas is still this high during a bear market.", dims: { humor: 0, formality: -5, brevity: 0, contrarianTone: 15 } },
  { text: "Hot take: most DeFi governance is theater. Token holders vote, whales decide.", dims: { humor: 10, formality: -10, brevity: 10, contrarianTone: 20 } },
  { text: "The merge was 18 months ago and we're still arguing about MEV. Builders are the new miners.", dims: { humor: 5, formality: 0, brevity: 5, contrarianTone: 10 } },
];

const referenceAccounts = ["Cobie", "Hsaka", "Ansem", "Hasu"];

export default function TrackAPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [dimensions, setDimensions] = useState({
    humor: 35, formality: 20, brevity: 60, contrarianTone: 45,
  });
  const [blendValues, setBlendValues] = useState([40, 30, 30]);
  const [ratings, setRatings] = useState<Record<number, "up" | "down" | null>>({});
  const [saving, setSaving] = useState(false);
  const [tweetLinks, setTweetLinks] = useState("");
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
  const [addingHandle, setAddingHandle] = useState(false);
  const [newHandle, setNewHandle] = useState("");

  const updateBlend = (index: number, value: number) => {
    const newValues = [...blendValues];
    newValues[index] = value;
    setBlendValues(newValues);
  };

  const rateTweet = (index: number, rating: "up" | "down") => {
    const tweet = sampleTweets[index];
    const mult = rating === "up" ? 1 : -1;
    setDimensions((prev) => ({
      humor: Math.min(100, Math.max(0, prev.humor + tweet.dims.humor * mult)),
      formality: Math.min(100, Math.max(0, prev.formality + tweet.dims.formality * mult)),
      brevity: Math.min(100, Math.max(0, prev.brevity + tweet.dims.brevity * mult)),
      contrarianTone: Math.min(100, Math.max(0, prev.contrarianTone + tweet.dims.contrarianTone * mult)),
    }));
    setRatings((prev) => ({ ...prev, [index]: rating }));
  };

  const toggleRef = (name: string) => {
    setSelectedRefs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddCustomHandle = () => {
    if (!newHandle.trim()) return;
    const clean = newHandle.trim().replace(/^@/, "");
    setSelectedRefs((prev) => new Set(prev).add(clean));
    setNewHandle("");
    setAddingHandle(false);
  };

  const handleSaveAndContinue = async () => {
    if (!token) return;
    setSaving(true);
    try {
      // Save voice dimensions
      await api.voice.updateProfile(token, dimensions);

      // Save selected reference voices
      for (const ref of Array.from(selectedRefs)) {
        try {
          await api.voice.addReference(token, ref, ref);
        } catch { /* may already exist */ }
      }

      // Create blend if references selected
      const refs = Array.from(selectedRefs);
      if (refs.length > 0) {
        try {
          await api.voice.createBlend(token, "Onboarding blend", [
            { label: "My voice", percentage: blendValues[0] },
            ...refs.slice(0, 2).map((r, i) => ({
              label: r,
              percentage: blendValues[i + 1] || Math.round(60 / refs.length),
            })),
          ]);
        } catch { /* blend creation optional */ }
      }

      router.push("/onboarding/handoff");
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell maxWidth="720px">
      <ProgressBar currentStep={1} totalSteps={6} />

      <div className="mt-8 space-y-8">
        {/* Handle display */}
        {user?.handle && (
          <p className="text-atlas-text-secondary text-sm text-center">
            Setting up voice for{" "}
            <span className="text-atlas-teal">@{user.handle}</span>
          </p>
        )}

        {/* Voice Card */}
        <section>
          <h2 className="font-heading text-xl text-atlas-text mb-4">
            This is what I think your writing voice is.
          </h2>
          <div className="space-y-3">
            <DimensionBar label="Humor" percentage={dimensions.humor} />
            <DimensionBar label="Formality" percentage={dimensions.formality} />
            <DimensionBar label="Brevity" percentage={dimensions.brevity} />
            <DimensionBar label="Contrarian tone" percentage={dimensions.contrarianTone} />
          </div>
          <p className="text-atlas-text-secondary text-sm italic mt-4">
            Rate the examples below to help me dial it in. Thumbs up = more like
            me, thumbs down = less.
          </p>
        </section>

        {/* Tweet Examples */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Rate these examples to refine your voice.
          </label>
          <div className="mt-3 space-y-3">
            {sampleTweets.map((tweet, i) => (
              <div
                key={i}
                className="bg-atlas-surface rounded-2xl p-4 flex items-start justify-between gap-4"
              >
                <p className="text-sm text-atlas-text flex-1">{tweet.text}</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => rateTweet(i, "up")}
                    className={`transition-colors ${
                      ratings[i] === "up"
                        ? "text-atlas-teal"
                        : "text-atlas-text-secondary hover:text-atlas-teal"
                    }`}
                    title="More like me"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rateTweet(i, "down")}
                    className={`transition-colors ${
                      ratings[i] === "down"
                        ? "text-atlas-error"
                        : "text-atlas-text-secondary hover:text-atlas-error"
                    }`}
                    title="Less like me"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Paste Tweet Links (Optional) */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Paste tweet links you like <span className="text-atlas-text-muted">(optional)</span>
          </label>
          <textarea
            value={tweetLinks}
            onChange={(e) => setTweetLinks(e.target.value)}
            placeholder="Paste one or more tweet URLs — one per line"
            rows={3}
            className="mt-2 w-full bg-atlas-surface rounded-2xl px-4 py-3 text-sm text-atlas-text placeholder-atlas-text-secondary border border-dashed border-atlas-text-secondary/30 focus:outline-none focus:border-atlas-teal resize-none"
          />
          <p className="text-atlas-text-muted text-xs mt-1">
            You can also send these via Telegram later.
          </p>
        </section>

        {/* Reference Accounts */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Add reference accounts for voice blending.
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {referenceAccounts.map((name) => (
              <div
                key={name}
                onClick={() => toggleRef(name)}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-full bg-atlas-surface border flex items-center justify-center text-atlas-text-secondary transition-colors ${
                  selectedRefs.has(name)
                    ? "border-atlas-teal ring-1 ring-atlas-teal"
                    : "border-glass-border group-hover:border-atlas-teal"
                }`}>
                  {name[0]}
                </div>
                <span className="text-xs text-atlas-text-secondary">
                  {name}
                </span>
              </div>
            ))}
            {addingHandle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomHandle(); }}
                  placeholder="@handle"
                  autoFocus
                  className="bg-atlas-surface rounded-lg px-3 py-2 text-sm text-atlas-text border border-glass-border focus:outline-none focus:border-atlas-teal w-32"
                />
                <button type="button" onClick={handleAddCustomHandle} className="text-atlas-teal text-xs">Add</button>
              </div>
            ) : (
              <div
                onClick={() => setAddingHandle(true)}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-atlas-surface border border-dashed border-atlas-text-secondary/30 flex items-center justify-center text-atlas-text-secondary group-hover:border-atlas-teal transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs text-atlas-text-muted">Add</span>
              </div>
            )}
          </div>
        </section>

        {/* Blend Sliders */}
        <section>
          <label className="text-xs text-atlas-text-secondary uppercase tracking-wide">
            Adjust your voice blend
          </label>
          <div className="mt-3 space-y-4">
            {["My voice", ...(Array.from(selectedRefs).slice(0, 2).length > 0 ? Array.from(selectedRefs).slice(0, 2) : ["Reference A", "Reference B"])].map((label, i) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-sm text-atlas-text-secondary w-28 shrink-0">
                  {label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={blendValues[i]}
                  onChange={(e) => updateBlend(i, Number(e.target.value))}
                  className="flex-1 accent-atlas-teal"
                />
                <span className="text-sm text-atlas-text w-10 text-right">
                  {blendValues[i]}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-atlas-text-muted text-xs mt-2">
            Set your starting blend — you can always change this later.
          </p>
        </section>

        <GradientButton
          fullWidth
          onClick={handleSaveAndContinue}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving your voice…
            </span>
          ) : (
            "Let\u2019s get started"
          )}
        </GradientButton>
      </div>
    </OnboardingShell>
  );
}
