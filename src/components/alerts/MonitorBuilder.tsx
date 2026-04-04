"use client";

import { useState } from "react";
import { AlertSubscription, api } from "@/lib/api";

const MONITOR_TYPES = [
  { id: "KEYWORD", label: "Keyword", description: "Match specific words or phrases" },
  { id: "TOPIC", label: "NLP Topic", description: "AI detects topic relevance" },
  { id: "ACCOUNT", label: "Account", description: "Track a specific X account" },
] as const;

const DELIVERY_OPTIONS = [
  { id: "in_app", label: "In-App" },
  { id: "telegram", label: "Telegram" },
] as const;

const SENTIMENT_OPTIONS = ["any", "bullish", "bearish", "neutral"] as const;

const SUGGESTED_TOPICS = [
  "Ethereum L2",
  "Bitcoin ETF",
  "DeFi Governance",
  "Solana DePIN",
  "Stablecoin Regulation",
  "AI x Crypto",
  "MEV",
  "Restaking",
];

interface MonitorBuilderProps {
  subscriptions: AlertSubscription[];
  onSubscriptionChange: () => void;
}

export default function MonitorBuilder({
  subscriptions,
  onSubscriptionChange,
}: MonitorBuilderProps) {
  const [showForm, setShowForm] = useState(false);
  const [monitorType, setMonitorType] = useState<string>("TOPIC");
  const [value, setValue] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [sentiment, setSentiment] = useState<string>("any");
  const [delivery, setDelivery] = useState<string[]>(["in_app"]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleCreate = async () => {
    const monitorValue =
      monitorType === "KEYWORD"
        ? keywords.join(", ")
        : value.trim();

    if (!monitorValue) {
      setError("Enter a topic, keyword, or account to monitor.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const fullValue = sentiment !== "any"
        ? `${monitorValue} [sentiment:${sentiment}]`
        : monitorValue;

      await api.alerts.subscribe(monitorType, fullValue, delivery);
      setValue("");
      setKeywords([]);
      setKeywordInput("");
      setSentiment("any");
      setShowForm(false);
      onSubscriptionChange();
    } catch {
      setError("Failed to create monitor.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-glass-border bg-atlas-surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-atlas-text">
            Signal Monitors
          </h3>
          <p className="mt-0.5 text-xs text-atlas-text-secondary">
            {subscriptions.length} active monitor{subscriptions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border border-atlas-teal/40 bg-atlas-teal/10 px-3 py-2 text-xs font-semibold text-atlas-teal transition-colors hover:border-atlas-teal hover:bg-atlas-teal/15"
        >
          {showForm ? "Cancel" : "+ New Monitor"}
        </button>
      </div>

      {showForm && (
        <div className="mt-5 space-y-4 border-t border-glass-border/50 pt-5">
          {/* Monitor Type */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted">
              Monitor Type
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MONITOR_TYPES.map((mt) => (
                <button
                  key={mt.id}
                  type="button"
                  onClick={() => setMonitorType(mt.id)}
                  className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                    monitorType === mt.id
                      ? "border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                      : "border-glass-border text-atlas-text-secondary hover:border-atlas-teal/50"
                  }`}
                >
                  <span className="font-semibold">{mt.label}</span>
                  <span className="ml-1.5 text-atlas-text-muted">{mt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Value Input */}
          {monitorType === "KEYWORD" ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted">
                Keywords
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Type a keyword and press Enter"
                  className="flex-1 rounded-lg border border-glass-border bg-atlas-bg/60 px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-atlas-text-secondary hover:text-atlas-teal"
                >
                  Add
                </button>
              </div>
              {keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 rounded-full bg-atlas-teal/10 px-2.5 py-1 text-xs text-atlas-teal"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="ml-0.5 text-atlas-teal/60 hover:text-atlas-teal"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted">
                {monitorType === "ACCOUNT" ? "X Handle" : "Topic"}
              </p>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  monitorType === "ACCOUNT"
                    ? "@handle"
                    : "e.g. Ethereum L2 scaling"
                }
                className="mt-2 w-full rounded-lg border border-glass-border bg-atlas-bg/60 px-3 py-2 text-sm text-atlas-text placeholder:text-atlas-text-muted focus:border-atlas-teal focus:outline-none"
              />
              {monitorType === "TOPIC" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setValue(topic)}
                      className="rounded-full border border-glass-border px-2.5 py-1 text-[10px] text-atlas-text-secondary transition-colors hover:border-atlas-teal/50 hover:text-atlas-text"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sentiment Filter */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted">
              Sentiment Filter
            </p>
            <div className="mt-2 flex gap-2">
              {SENTIMENT_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSentiment(s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                    sentiment === s
                      ? "border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                      : "border-glass-border text-atlas-text-secondary hover:border-atlas-teal/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Channels */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-text-muted">
              Deliver To
            </p>
            <div className="mt-2 flex gap-2">
              {DELIVERY_OPTIONS.map((d) => {
                const active = delivery.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setDelivery(
                        active
                          ? delivery.filter((x) => x !== d.id)
                          : [...delivery, d.id]
                      )
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? "border-atlas-teal bg-atlas-teal/10 text-atlas-teal"
                        : "border-glass-border text-atlas-text-secondary hover:border-atlas-teal/50"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-atlas-error">{error}</p>
          )}

          {/* Create Button */}
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="w-full rounded-lg bg-gradient-to-r from-atlas-teal to-atlas-steel px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Monitor"}
          </button>
        </div>
      )}

      {/* Existing Monitors */}
      {subscriptions.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-glass-border/50 pt-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between rounded-xl border border-glass-border/50 bg-atlas-bg/30 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-atlas-text truncate">
                    {sub.value}
                  </span>
                  <span className="shrink-0 rounded-full bg-glass px-2 py-0.5 text-[10px] uppercase tracking-wide text-atlas-text-muted">
                    {sub.type}
                  </span>
                </div>
                {sub.delivery.length > 0 && (
                  <p className="mt-0.5 text-[10px] text-atlas-text-muted">
                    Delivers to: {sub.delivery.join(", ")}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 ml-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  sub.isActive
                    ? "bg-atlas-teal/10 text-atlas-teal"
                    : "bg-glass text-atlas-text-muted"
                }`}
              >
                {sub.isActive ? "Active" : "Paused"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
