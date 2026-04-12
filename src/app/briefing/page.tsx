"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings, RefreshCw, Clock, ChevronDown, ChevronUp, PenTool, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import FeatureGate from "@/components/ui/FeatureGate";
import { useRouter } from "next/navigation";
import { api, Briefing, BriefingSection } from "@/lib/api";

const TOPIC_OPTIONS = [
  "AI & Crypto", "Macro", "Stablecoins/RWA", "DeFi", "NFTs/Gaming", "Regulation",
] as const;

const SOURCE_OPTIONS = [
  "Delphi Research", "X/Twitter", "News", "On-chain Data",
] as const;

const DELIVERY_CHANNELS = ["Portal Only", "Portal + Email", "Portal + Telegram"] as const;

type TopicOption = (typeof TOPIC_OPTIONS)[number];
type SourceOption = (typeof SOURCE_OPTIONS)[number];
type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

const BRIEF_TYPES = [
  { id: "morning", label: "Morning Brief" },
  { id: "sector", label: "Sector Deep Dive" },
  { id: "alpha", label: "Alpha Scan" },
  { id: "competitor", label: "Competitor Watch" },
] as const;

const chipClasses = (selected: boolean) =>
  `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
    selected
      ? "border-atlas-teal bg-atlas-teal text-atlas-bg shadow-sm shadow-atlas-teal/30"
      : "border-glass-border bg-atlas-surface text-atlas-text-secondary hover:border-atlas-teal/50 hover:text-atlas-text"
  }`;

function BriefingCard({ briefing, expanded, onToggle, onCraft, isLatest }: { briefing: Briefing; expanded: boolean; onToggle: () => void; onCraft: () => void; isLatest?: boolean }) {
  const date = new Date(briefing.createdAt);
  const timeAgo = getTimeAgo(date);

  return (
    <GlassCard maxWidth="full" className={`space-y-4 ${isLatest ? "border-l-2 border-l-atlas-teal bg-gradient-to-r from-atlas-teal/[0.03] to-transparent" : ""}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between text-left">
        <div className="space-y-1">
          <h2 className="font-heading font-bold tracking-tight text-xl text-atlas-text sm:text-2xl">
            {briefing.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-atlas-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            {!expanded && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCraft(); }}
                className="flex items-center gap-1 rounded-md bg-atlas-teal/10 px-2 py-0.5 text-[11px] font-medium text-atlas-teal transition-colors hover:bg-atlas-teal/20"
              >
                <PenTool className="h-3 w-3" />
                Craft
              </button>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-atlas-text-muted" />
        ) : (
          <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-atlas-text-muted" />
        )}
      </button>

      <p className="text-sm leading-relaxed text-atlas-text-secondary">{briefing.summary}</p>

      {expanded && (
        <div className="space-y-4 border-t border-glass-border pt-4">
          {(briefing.sections as BriefingSection[]).map((section, i) => (
            <div key={i}>
              <h3 className="mb-2 text-sm font-semibold text-atlas-text">
                {section.emoji} {section.heading}
              </h3>
              <ul className="space-y-1.5 pl-5">
                {section.bullets.map((bullet, j) => (
                  <li key={j} className="list-disc text-sm leading-relaxed text-atlas-text-secondary">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {briefing.topics.map((t) => (
              <span key={t} className="rounded-full border border-glass-border px-2 py-0.5 text-[10px] text-atlas-text-muted">
                {t}
              </span>
            ))}
          </div>
          <div className="flex justify-end border-t border-glass-border pt-4">
            <button
              type="button"
              onClick={onCraft}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <PenTool className="h-4 w-4" />
              Take to Crafting Station
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BriefingPage() {
  const router = useRouter();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [briefType, setBriefType] = useState("morning");
  const [showSettings, setShowSettings] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [selectedTopics, setSelectedTopics] = useState<TopicOption[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceOption[]>([]);
  const [channel, setChannel] = useState<DeliveryChannel>("Portal Only");
  const [deliveryTime, setDeliveryTime] = useState("08:00");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api.briefing.getPreferences(),
      api.briefing.history(),
    ])
      .then(([prefRes, histRes]) => {
        const pref = prefRes.preference;
        setHasPreferences(!!pref);
        if (pref) {
          setSelectedTopics(pref.topics.filter((t): t is TopicOption => (TOPIC_OPTIONS as readonly string[]).includes(t)));
          setSelectedSources(pref.sources.filter((s): s is SourceOption => (SOURCE_OPTIONS as readonly string[]).includes(s)));
          setChannel((pref.channel ?? "Portal Only") as DeliveryChannel);
          setDeliveryTime(pref.deliveryTime || "08:00");
        }
        setBriefings(histRes.briefings ?? []);
        if (histRes.briefings?.length > 0) {
          setExpandedId(histRes.briefings[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.briefing.generate(briefType);
      setBriefings((prev) => [res.briefing, ...prev]);
      setExpandedId(res.briefing.id);
    } catch {
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaved(false);
    try {
      await api.briefing.updatePreferences({
        deliveryTime,
        topics: selectedTopics,
        sources: selectedSources,
        channel,
      });
      setSaved(true);
      setHasPreferences(true);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-atlas-teal" />
      </div>
    );
  }

  if (!hasPreferences) {
    return (
      <div className="mx-auto max-w-3xl py-8 space-y-6">
          <header className="space-y-3" data-tour="briefing-header">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">Morning Briefing</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-atlas-teal/10 px-2.5 py-0.5 text-[10px] font-semibold text-atlas-teal ring-1 ring-atlas-teal/20">
                <Sparkles className="h-3 w-3" /> AI-powered
              </span>
            </div>
            <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text sm:text-4xl">
              Your Daily Briefing
            </h1>
          <p className="mt-2 text-atlas-text-secondary max-w-2xl">Your personalized morning digest. Atlas surfaces the signals that matter most to your beat and suggests what to post about today.</p>
            <p className="text-sm text-atlas-text-secondary">
              Choose your topics, sources, and delivery preferences. After setup you&apos;ll see your briefings here.
            </p>
          </header>
          <PreferencesForm
            topics={selectedTopics} sources={selectedSources} channel={channel}
            deliveryTime={deliveryTime} saved={saved}
            onTopicToggle={(t) => { setSaved(false); setSelectedTopics((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]); }}
            onSourceToggle={(s) => { setSaved(false); setSelectedSources((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }}
            onChannelChange={(c) => { setSaved(false); setChannel(c); }}
            onDeliveryTimeChange={(t) => { setSaved(false); setDeliveryTime(t); }}
            onSave={handleSavePreferences}
          />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-tour="briefing-header">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">Morning Briefing</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-atlas-teal/10 px-2.5 py-0.5 text-[10px] font-semibold text-atlas-teal ring-1 ring-atlas-teal/20">
                <Sparkles className="h-3 w-3" /> AI-powered
              </span>
            </div>
            <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text sm:text-4xl">
              Your Briefings
              {briefings.length === 0 && (
                <span className="ml-2 inline-flex items-center gap-1 align-middle rounded-full bg-atlas-teal/10 px-2.5 py-0.5 text-[10px] font-semibold text-atlas-teal ring-1 ring-atlas-teal/20">
                  <Sparkles className="h-3 w-3" /> NEW
                </span>
              )}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-atlas-text-secondary">
              Your personalized daily digest. Atlas scans your topics, sources, and the latest market activity to generate a concise briefing you can read in under 2 minutes. Hit Generate Now to create one on demand, or set a delivery time to get them automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-atlas-text-secondary transition-colors hover:text-atlas-text"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
            <select
              value={briefType}
              onChange={(e) => setBriefType(e.target.value)}
              className="rounded-lg border border-glass-border bg-atlas-nav px-3 py-2 text-xs text-atlas-text outline-none focus:border-atlas-teal"
            >
              {BRIEF_TYPES.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.label}</option>
              ))}
            </select>
            <GradientButton onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Generate Now
                </span>
              )}
            </GradientButton>
          </div>
        </header>

        {showSettings && (
          <PreferencesForm
            topics={selectedTopics} sources={selectedSources} channel={channel}
            deliveryTime={deliveryTime} saved={saved}
            onTopicToggle={(t) => { setSaved(false); setSelectedTopics((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]); }}
            onSourceToggle={(s) => { setSaved(false); setSelectedSources((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }}
            onChannelChange={(c) => { setSaved(false); setChannel(c); }}
            onDeliveryTimeChange={(t) => { setSaved(false); setDeliveryTime(t); }}
            onSave={handleSavePreferences}
          />
        )}

        {briefings.length === 0 ? (
          <GlassCard maxWidth="full" className="py-16 text-center space-y-4" data-tour="briefing-empty">
            <Sparkles className="mx-auto h-10 w-10 text-atlas-teal/60" />
            <p className="font-heading text-lg font-semibold text-atlas-text">Your briefing is ready to generate</p>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-atlas-text-secondary">
              Your personalized briefing is ready to generate. Atlas will pull the latest signals from your topics, analyze sentiment, and surface what matters most &mdash; all in under 2 minutes.
            </p>
            <p className="text-xs text-atlas-text-muted">
              Hit <strong className="text-atlas-text">Generate Now</strong> above to get started.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {briefings.map((b, i) => (
              <BriefingCard
                key={b.id}
                briefing={b}
                expanded={expandedId === b.id}
                isLatest={i === 0}
                onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
                onCraft={() => {
                  const content = b.summary + "\n\n" + (b.sections as BriefingSection[]).map((s) => s.emoji + " " + s.heading + "\n" + s.bullets.join("\n")).join("\n\n");
                  router.push("/crafting?content=" + encodeURIComponent(content));
                }}
              />
            ))}
          </div>
        )}
    </div>
  );
}

function PreferencesForm({
  topics, sources, channel, deliveryTime, saved,
  onTopicToggle, onSourceToggle, onChannelChange, onDeliveryTimeChange, onSave,
}: {
  topics: TopicOption[];
  sources: SourceOption[];
  channel: DeliveryChannel;
  deliveryTime: string;
  saved: boolean;
  onTopicToggle: (t: TopicOption) => void;
  onSourceToggle: (s: SourceOption) => void;
  onChannelChange: (c: DeliveryChannel) => void;
  onDeliveryTimeChange: (t: string) => void;
  onSave: () => void;
}) {
  return (
    <GlassCard maxWidth="full" className="space-y-5">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-atlas-text">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((t) => (
              <button key={t} type="button" onClick={() => onTopicToggle(t)} className={chipClasses(topics.includes(t))}>
                {topics.includes(t) && <span className="mr-1">&#10003;</span>}{t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-atlas-text">Sources</h3>
          <div className="flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((s) => (
              <button key={s} type="button" onClick={() => onSourceToggle(s)} className={chipClasses(sources.includes(s))}>
                {sources.includes(s) && <span className="mr-1">&#10003;</span>}{s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-atlas-text">Delivery Channel</h3>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_CHANNELS.map((c) => (
              <button key={c} type="button" onClick={() => onChannelChange(c)} className={chipClasses(channel === c)}>
                {channel === c && <span className="mr-1">&#10003;</span>}{c}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-atlas-text">Delivery Time</h3>
          <input
            type="time"
            value={deliveryTime}
            onChange={(e) => onDeliveryTimeChange(e.target.value)}
            className="w-full max-w-[180px] rounded-lg border border-glass-border bg-atlas-nav px-4 py-2.5 text-sm text-atlas-text outline-none focus:border-atlas-teal"
          />
        </div>
      </div>
      <div className="flex items-center gap-4 border-t border-glass-border pt-4">
        <GradientButton onClick={onSave}>Save Preferences</GradientButton>
        {saved && <span className="text-sm text-atlas-success">Saved</span>}
      </div>
    </GlassCard>
  );
}

export default function BriefingPageGated() {
  return (
    <FeatureGate flagKey="briefing">
      <BriefingPage />
    </FeatureGate>
  );
}
