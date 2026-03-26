"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import GradientButton from "@/components/ui/GradientButton";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, TweetDraft, TeamMember } from "@/lib/api";

interface StyleCard {
  tweet: string;
  subtext?: string;
  blend: string;
  engagement: string;
  authorHandle?: string;
}

const staticStyleCards: StyleCard[] = [
  { tweet: "DeFi isn't just rebuilding finance; it's architecting a new social contract. Liquidity is the new speech. Exit is the new vote. We are early, but the map is clear.", blend: "70% Analyst + 30% Naval", engagement: "12.4k" },
  { tweet: "The 10-year yield is screaming. Crypto is whisper-quiet. Historically, this divergence precedes the largest structural shifts in capital allocation we've seen since the 70s.", subtext: "Volatility isn't risk; it's the price of entry for those who can see the cycle before the crowd.", blend: "90% Macro Strategist + 10% Zen", engagement: "8.2k" },
  { tweet: "Gm to everyone building the future on-chain while the legacy world debates the definition of a spreadsheet. The alpha is in the execution, not the whitepaper.", blend: "50% Builder + 50% Optimist", engagement: "4.1k" },
  { tweet: "Protocol-market fit is the only metric that matters. TVL is a vanity stat if it's mercenary capital waiting for the next bridge incentive.", blend: "100% Raw Data Analyst", engagement: "22.9k" },
  { tweet: "1/ Why the ZK-rollup endgame is closer than you think. A thread on the convergence of prover efficiency and decentralized sequencing.", subtext: "Most people focus on L2 fees today. The real story is the cross-chain interoperability layer that turns 100 chains into 1 seamless experience.", blend: "60% Tech Whisperer + 40% Vitalik", engagement: "15.5k" },
  { tweet: "Stop trading the noise. Start observing the signals. The most successful investors in this space aren't the fastest; they're the ones who can sit still the longest.", blend: "80% Stoic + 20% Balaji", engagement: "6.7k" },
];

export default function TeamLibraryPage() {
  const { token } = useAuth();
  const [styleCards, setStyleCards] = useState<StyleCard[]>(staticStyleCards);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(42);

  const loadData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const [teamRes, draftsRes] = await Promise.all([
        api.users.team(token),
        api.drafts.list(token, "APPROVED"),
      ]);
      const team = teamRes.team;
      const drafts = draftsRes.drafts;

      if (drafts.length > 0) {
        const teamMap = new Map(team.map((m: TeamMember) => [m.id, m]));
        const cards: StyleCard[] = drafts.slice(0, 6).map((d: TweetDraft) => ({
          tweet: d.content,
          blend: "Team voice",
          engagement: d.predictedEngagement
            ? `${(d.predictedEngagement / 1000).toFixed(1)}k`
            : d.actualEngagement
            ? `${(d.actualEngagement / 1000).toFixed(1)}k`
            : "—",
        }));
        setStyleCards(cards);
        setTotalCount(drafts.length);
      }
    } catch (e) {
      console.error("Failed to load team library:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-4xl text-atlas-text">
          Team Style Library
        </h1>
        <p className="text-atlas-text-secondary mt-2">
          Curated editorial voices for the next generation of DeFi communication.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        {["By analyst", "By voice type", "By engagement"].map((filter) => (
          <select
            key={filter}
            className="bg-atlas-surface border border-glass-border rounded-lg px-4 py-2.5 text-sm text-atlas-text-secondary focus:outline-none focus:border-atlas-teal"
          >
            <option>{filter}</option>
          </select>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 mb-6 text-atlas-text-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading library…
        </div>
      )}

      {/* Masonry Grid */}
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {styleCards.map((card, i) => (
          <div key={i} className="break-inside-avoid bg-atlas-surface border border-glass-border rounded-2xl p-8">
            <p className="text-lg text-atlas-text leading-relaxed">{card.tweet}</p>
            {card.subtext && (
              <p className="text-sm text-atlas-text-secondary mt-3 italic">{card.subtext}</p>
            )}
            <div className="mt-4 pt-4 border-t border-glass-border">
              <p className="text-sm text-atlas-text-secondary font-medium">{card.blend}</p>
              <p className="text-xs text-atlas-teal font-bold mt-1">{card.engagement} Engagement</p>
            </div>
            <div className="mt-3 flex gap-4">
              <button type="button" className="text-xs font-bold text-atlas-teal hover:underline">Use this style</button>
              <button type="button" className="text-xs font-bold text-atlas-text-secondary hover:text-atlas-text">Preview</button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer count */}
      <p className="text-sm text-atlas-text-secondary mt-6 text-center">
        {styleCards.length} styles shown out of {totalCount}
      </p>

      {/* Management Bar */}
      <div className="mt-8 bg-atlas-surface border border-glass-border rounded-2xl px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <button type="button" className="text-sm font-bold text-atlas-text hover:text-atlas-teal transition-colors">Manage All</button>
        <GradientButton>Push a style to all</GradientButton>
      </div>
    </AppShell>
  );
}
