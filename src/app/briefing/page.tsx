"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { api } from "@/lib/api";

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

const isTopicOption = (value: string): value is TopicOption =>
  TOPIC_OPTIONS.includes(value as TopicOption);

const isSourceOption = (value: string): value is SourceOption =>
  SOURCE_OPTIONS.includes(value as SourceOption);

const isDeliveryChannel = (value: string): value is DeliveryChannel =>
  DELIVERY_CHANNELS.includes(value as DeliveryChannel);

const selectionChipBaseClasses =
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-atlas-teal/30";

const getSelectionChipClasses = (isSelected: boolean) =>
  `${selectionChipBaseClasses} ${
    isSelected
      ? "border-atlas-teal bg-atlas-teal text-atlas-text shadow-sm shadow-atlas-teal/30"
      : "border-glass-border bg-atlas-surface text-atlas-text-secondary hover:border-atlas-teal/50 hover:bg-atlas-teal/10 hover:text-atlas-text"
  }`;

export default function BriefingPage() {
  const [deliveryTime, setDeliveryTime] = useState("08:00");
  const [selectedTopics, setSelectedTopics] = useState<TopicOption[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceOption[]>([]);
  const [channel, setChannel] = useState<DeliveryChannel>("Portal Only");
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const data = await api.briefing.getPreferences();
        const preference = data?.preference;

        if (!isMounted || !preference) {
          return;
        }

        if (typeof preference.deliveryTime === "string" && preference.deliveryTime) {
          setDeliveryTime(preference.deliveryTime);
        }

        if (Array.isArray(preference.topics)) {
          setSelectedTopics(
            preference.topics.filter((topic): topic is TopicOption => isTopicOption(topic))
          );
        }

        if (Array.isArray(preference.sources)) {
          setSelectedSources(
            preference.sources.filter((source): source is SourceOption => isSourceOption(source))
          );
        }

        const savedChannel = preference.channel ?? preference.deliveryChannel;

        if (typeof savedChannel === "string" && isDeliveryChannel(savedChannel)) {
          setChannel(savedChannel);
        }
      } catch {
        // Silently fail. Local UI state remains the fallback.
      }
    };

    void loadPreferences();

    return () => {
      isMounted = false;
    };
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
    setChannel(channel);
  };

  const handleSave = async () => {
    setSaved(true);
    try {
      await api.briefing.updatePreferences({
        deliveryTime,
        topics: selectedTopics,
        sources: selectedSources,
        channel,
      });
    } catch {
      // Backend save failed. The current UI state remains available.
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSave();
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-2 sm:gap-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">
          Morning Briefing
        </p>
        <h1 className="font-heading font-extrabold tracking-tight text-3xl text-atlas-text sm:text-4xl">
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
            <h2 className="font-heading font-bold tracking-tight text-2xl text-atlas-text">
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
            <h2 className="font-heading font-bold tracking-tight text-2xl text-atlas-text">Topics</h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Tailor the macro and sector themes we should prioritize in your brief.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="sr-only">Topics</legend>
            <div className="flex flex-wrap gap-2">
              {TOPIC_OPTIONS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);

                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    aria-pressed={isSelected}
                    className={getSelectionChipClasses(isSelected)}
                  >
                    {isSelected ? (
                      <span aria-hidden="true" className="mr-1">
                        ✓
                      </span>
                    ) : null}
                    {topic}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </GlassCard>

        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading font-bold tracking-tight text-2xl text-atlas-text">Sources</h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Select the research channels we should blend into the morning digest.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="sr-only">Sources</legend>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((source) => {
                const isSelected = selectedSources.includes(source);

                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => toggleSource(source)}
                    aria-pressed={isSelected}
                    className={getSelectionChipClasses(isSelected)}
                  >
                    {isSelected ? (
                      <span aria-hidden="true" className="mr-1">
                        ✓
                      </span>
                    ) : null}
                    {source}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </GlassCard>

        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading font-bold tracking-tight text-2xl text-atlas-text">
              Delivery Channel
            </h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Decide where your personalized digest should land each morning.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="sr-only">Delivery Channel</legend>
            <div
              aria-label="Delivery Channel"
              className="flex flex-wrap gap-2"
              role="radiogroup"
            >
              {DELIVERY_CHANNELS.map((deliveryOption) => {
                const isSelected = channel === deliveryOption;

                return (
                  <button
                    key={deliveryOption}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleChannelChange(deliveryOption)}
                    className={getSelectionChipClasses(isSelected)}
                  >
                    {isSelected ? (
                      <span aria-hidden="true" className="mr-1">
                        ✓
                      </span>
                    ) : null}
                    {deliveryOption}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </GlassCard>

        <GlassCard maxWidth="full" className="space-y-5">
          <div className="space-y-2">
            <h2 className="font-heading font-bold tracking-tight text-2xl text-atlas-text">
              Save Preferences
            </h2>
            <p className="text-sm leading-6 text-atlas-text-secondary">
              Save these selections to your briefing profile so they load
              automatically the next time you open this page.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-atlas-text-secondary">
              {selectedTopics.length} topic{selectedTopics.length === 1 ? "" : "s"}
              {" · "}
              {selectedSources.length} source{selectedSources.length === 1 ? "" : "s"}
              {" · "}
              {channel}
            </div>

            <button
              className="rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-teal/60 px-6 py-3 font-body text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-atlas-teal/40"
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
              Preferences saved.
            </p>
          )}
        </GlassCard>
      </form>
    </div>
  );
}
