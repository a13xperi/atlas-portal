"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";

const TOPIC_OPTIONS = [
  "AI & Crypto",
  "Macro",
  "Stablecoins/RWA",
  "DeFi",
  "NFTs/Gaming",
  "Regulation",
] as const;

const SOURCE_OPTIONS = [
  "Delphi Research",
  "X/Twitter",
  "News",
  "On-chain Data",
] as const;

const DELIVERY_CHANNELS = [
  "Portal Only",
  "Portal + Email",
  "Portal + Telegram",
] as const;

type TopicOption = (typeof TOPIC_OPTIONS)[number];
type SourceOption = (typeof SOURCE_OPTIONS)[number];
type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

export default function BriefingPage() {
  const [deliveryTime, setDeliveryTime] = useState("08:00");
  const [selectedTopics, setSelectedTopics] = useState<TopicOption[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceOption[]>([]);
  const [deliveryChannel, setDeliveryChannel] =
    useState<DeliveryChannel>("Portal Only");
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  const toggleTopic = (topic: TopicOption) => {
    setSaved(false);
    setSelectedTopics((currentTopics) =>
      currentTopics.includes(topic)
        ? currentTopics.filter((currentTopic) => currentTopic !== topic)
        : [...currentTopics, topic]
    );
  };

  const toggleSource = (source: SourceOption) => {
    setSaved(false);
    setSelectedSources((currentSources) =>
      currentSources.includes(source)
        ? currentSources.filter((currentSource) => currentSource !== source)
        : [...currentSources, source]
    );
  };

  const handleDeliveryTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setDeliveryTime(event.target.value);
  };

  const handleChannelChange = (channel: DeliveryChannel) => {
    setSaved(false);
    setDeliveryChannel(channel);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-2 sm:gap-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">
          Morning Briefing
        </p>
        <h1 className="font-heading text-3xl text-atlas-text sm:text-4xl">
          Configure Your Daily Digest
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary sm:text-base">
          Configure your daily morning briefing. We&apos;ll prepare a personalized
          crypto intelligence digest every morning.
        </p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl text-atlas-text">
              Delivery Time
            </h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Choose when the digest should be prepared for your morning workflow.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr] md:items-end">
            <label className="space-y-2 text-sm text-atlas-text-secondary">
              <span className="block font-medium text-atlas-text">
                Daily delivery time
              </span>
              <input
                aria-label="Daily delivery time"
                className="w-full rounded-lg border border-glass-border bg-atlas-nav px-4 py-3 text-sm text-atlas-text outline-none transition-colors focus:border-atlas-teal"
                onChange={handleDeliveryTimeChange}
                type="time"
                value={deliveryTime}
              />
            </label>

            <div className="rounded-lg border border-glass-border bg-atlas-nav/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-atlas-text-muted">
                Timezone
              </p>
              <p className="mt-2 text-sm text-atlas-text-secondary">
                Local timezone: <span className="text-atlas-text">{timezone}</span>
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl text-atlas-text">Topics</h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Tailor the macro and sector themes we should prioritize in your brief.
            </p>
          </div>

          <fieldset className="grid gap-3 md:grid-cols-2">
            <legend className="sr-only">Topics</legend>
            {TOPIC_OPTIONS.map((topic) => (
              <label
                key={topic}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-glass-border bg-atlas-nav/60 px-4 py-4 transition-colors hover:border-atlas-teal/60"
              >
                <input
                  checked={selectedTopics.includes(topic)}
                  className="mt-1 h-4 w-4 accent-atlas-teal"
                  onChange={() => toggleTopic(topic)}
                  type="checkbox"
                />
                <span className="text-sm text-atlas-text">{topic}</span>
              </label>
            ))}
          </fieldset>
        </GlassCard>

        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl text-atlas-text">Sources</h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Select the research channels we should blend into the morning digest.
            </p>
          </div>

          <fieldset className="grid gap-3 md:grid-cols-2">
            <legend className="sr-only">Sources</legend>
            {SOURCE_OPTIONS.map((source) => (
              <label
                key={source}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-glass-border bg-atlas-nav/60 px-4 py-4 transition-colors hover:border-atlas-teal/60"
              >
                <input
                  checked={selectedSources.includes(source)}
                  className="mt-1 h-4 w-4 accent-atlas-teal"
                  onChange={() => toggleSource(source)}
                  type="checkbox"
                />
                <span className="text-sm text-atlas-text">{source}</span>
              </label>
            ))}
          </fieldset>
        </GlassCard>

        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl text-atlas-text">
              Delivery Channel
            </h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Decide where your personalized digest should land each morning.
            </p>
          </div>

          <fieldset className="grid gap-3">
            <legend className="sr-only">Delivery Channel</legend>
            {DELIVERY_CHANNELS.map((channel) => (
              <label
                key={channel}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-glass-border bg-atlas-nav/60 px-4 py-4 transition-colors hover:border-atlas-teal/60"
              >
                <input
                  checked={deliveryChannel === channel}
                  className="mt-1 h-4 w-4 accent-atlas-teal"
                  name="delivery-channel"
                  onChange={() => handleChannelChange(channel)}
                  type="radio"
                />
                <span className="text-sm text-atlas-text">{channel}</span>
              </label>
            ))}
          </fieldset>
        </GlassCard>

        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl text-atlas-text">
              Save Preferences
            </h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              This saves your selections in local UI state for now while backend
              preferences are still being wired up.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-atlas-text-secondary">
              {selectedTopics.length} topic{selectedTopics.length === 1 ? "" : "s"}
              {" · "}
              {selectedSources.length} source{selectedSources.length === 1 ? "" : "s"}
              {" · "}
              {deliveryChannel}
            </div>

            <button
              className="rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-steel px-6 py-3 font-body text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-atlas-teal/40"
              type="submit"
            >
              Save briefing preferences
            </button>
          </div>

          {saved && (
            <p
              aria-live="polite"
              className="text-sm text-atlas-success"
            >
              Preferences saved locally for this session.
            </p>
          )}
        </GlassCard>
      </form>
    </div>
  );
}
