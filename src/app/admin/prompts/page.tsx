"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FeatureGate from "@/components/ui/FeatureGate";
import { api, PromptConfig, PromptTestResult } from "@/lib/api";
import { Play, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VariablesState = Record<string, string>;
type TestState = {
  loading: boolean;
  result: PromptTestResult | null;
  error: string | null;
};

function categoryBadgeClass(category: PromptConfig["category"]): string {
  if (category === "generation") {
    return "bg-atlas-teal/15 text-atlas-teal border-atlas-teal/30";
  }
  return "bg-white/5 text-atlas-text-muted border-glass-border";
}

function formatCategory(category: PromptConfig["category"]): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PromptsContent() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [variableState, setVariableState] = useState<Record<string, VariablesState>>({});
  const [testState, setTestState] = useState<Record<string, TestState>>({});

  // ---- Load prompts on mount ----
  useEffect(() => {
    let cancelled = false;
    api.admin
      .getPrompts()
      .then((res) => {
        if (cancelled) return;
        setPrompts(res.prompts ?? []);
        // Pre-fill variable inputs with the example values.
        const initial: Record<string, VariablesState> = {};
        for (const p of res.prompts ?? []) {
          initial[p.id] = {};
          for (const v of p.variables) {
            initial[p.id][v.name] = v.example;
          }
        }
        setVariableState(initial);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message ?? "Failed to load prompts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Handlers ----
  const toggleTest = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setVariable = useCallback(
    (promptId: string, name: string, value: string) => {
      setVariableState((prev) => ({
        ...prev,
        [promptId]: { ...(prev[promptId] ?? {}), [name]: value },
      }));
    },
    [],
  );

  const runTest = useCallback(
    async (prompt: PromptConfig) => {
      const vars = variableState[prompt.id] ?? {};
      setTestState((prev) => ({
        ...prev,
        [prompt.id]: { loading: true, result: null, error: null },
      }));
      try {
        const result = await api.admin.testPrompt(prompt.id, vars);
        setTestState((prev) => ({
          ...prev,
          [prompt.id]: { loading: false, result, error: null },
        }));
      } catch (err: any) {
        setTestState((prev) => ({
          ...prev,
          [prompt.id]: {
            loading: false,
            result: null,
            error: err?.message ?? "Test run failed",
          },
        }));
      }
    },
    [variableState],
  );

  // ---- Render ----
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-sm text-atlas-text-secondary">
            Loading prompt catalog...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-2">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-atlas-teal">
            Admin
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-atlas-text sm:text-4xl">
            Prompt Inspector
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-atlas-text-secondary">
            All AI algorithms in Atlas -- view templates, variables, and test
            live. Every Claude prompt the platform sends on your behalf, with a
            way to run it against Haiku so you can see what comes back.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {prompts.length === 0 && !error && (
          <div className="rounded-2xl border border-glass-border bg-glass p-12 text-center backdrop-blur-xl">
            <p className="text-atlas-text-secondary">
              No prompts in catalog. Register prompts in
              services/api/src/lib/prompt-catalog.ts to see them here.
            </p>
          </div>
        )}

        {/* Grid of prompt cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              variables={variableState[prompt.id] ?? {}}
              test={testState[prompt.id] ?? { loading: false, result: null, error: null }}
              expanded={!!expanded[prompt.id]}
              onToggle={() => toggleTest(prompt.id)}
              onVariableChange={(name, value) => setVariable(prompt.id, name, value)}
              onRunTest={() => runTest(prompt)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function PromptCard({
  prompt,
  variables,
  test,
  expanded,
  onToggle,
  onVariableChange,
  onRunTest,
}: {
  prompt: PromptConfig;
  variables: VariablesState;
  test: TestState;
  expanded: boolean;
  onToggle: () => void;
  onVariableChange: (name: string, value: string) => void;
  onRunTest: () => void;
}) {
  const badgeClass = useMemo(() => categoryBadgeClass(prompt.category), [prompt.category]);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-glass-border bg-glass p-6 backdrop-blur-xl">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}
            >
              {formatCategory(prompt.category)}
            </span>
            <span className="rounded-md border border-glass-border bg-atlas-surface/60 px-2 py-0.5 font-mono text-[10px] text-atlas-text-muted">
              {prompt.model}
            </span>
          </div>
          <h2 className="font-heading text-xl font-bold text-atlas-text">
            {prompt.name}
          </h2>
          <p className="text-xs leading-6 text-atlas-text-secondary">
            {prompt.description}
          </p>
        </div>
      </div>

      {/* System prompt */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-atlas-text-muted">
          System Prompt
        </h3>
        <pre className="max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-glass-border bg-black/30 p-3 font-mono text-[11px] leading-5 text-atlas-text">
          {prompt.systemPrompt}
        </pre>
      </section>

      {/* User prompt template */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-atlas-text-muted">
          User Prompt Template
        </h3>
        <pre className="max-h-[140px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-glass-border bg-black/30 p-3 font-mono text-[11px] leading-5 text-atlas-text">
          {prompt.userPromptTemplate}
        </pre>
      </section>

      {/* Variables table */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-atlas-text-muted">
          Variables ({prompt.variables.length})
        </h3>
        <div className="overflow-hidden rounded-lg border border-glass-border">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-atlas-surface/60 text-atlas-text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wider">Description</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wider">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {prompt.variables.map((v) => (
                <tr key={v.name} className="bg-black/20">
                  <td className="px-3 py-2 align-top">
                    <code className="rounded bg-atlas-teal/10 px-1.5 py-0.5 font-mono text-[10px] text-atlas-teal">
                      {v.name}
                    </code>
                  </td>
                  <td className="px-3 py-2 align-top text-atlas-text-secondary">
                    {v.description}
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-[10px] text-atlas-text-muted">
                    {v.example}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Test this prompt */}
      <section className="space-y-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-2 rounded-lg border border-glass-border bg-atlas-surface/60 px-3 py-2 text-left text-xs font-semibold text-atlas-text transition-colors hover:border-atlas-teal/40 hover:text-atlas-teal"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          Test this prompt
          <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-atlas-text-muted">
            Runs on Haiku
          </span>
        </button>

        {expanded && (
          <div className="space-y-4 rounded-lg border border-glass-border bg-black/20 p-4">
            {/* Variable inputs */}
            <div className="space-y-3">
              {prompt.variables.map((v) => (
                <div key={v.name} className="space-y-1">
                  <label
                    htmlFor={`${prompt.id}-${v.name}`}
                    className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-atlas-text-muted"
                  >
                    <code className="rounded bg-atlas-teal/10 px-1.5 py-0.5 font-mono text-[10px] text-atlas-teal">
                      {v.name}
                    </code>
                  </label>
                  <textarea
                    id={`${prompt.id}-${v.name}`}
                    rows={v.example.length > 80 ? 3 : 1}
                    value={variables[v.name] ?? ""}
                    onChange={(e) => onVariableChange(v.name, e.target.value)}
                    placeholder={v.example}
                    className="w-full resize-y rounded-lg border border-glass-border bg-atlas-surface/60 px-3 py-2 font-mono text-[11px] text-atlas-text placeholder-atlas-text-muted focus:border-atlas-teal focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Run button */}
            <button
              onClick={onRunTest}
              disabled={test.loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-delphi-teal to-delphi-teal/60 px-4 py-2 text-xs font-semibold text-atlas-bg shadow-lg shadow-atlas-teal/20 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {test.loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Run
                </>
              )}
            </button>

            {/* Error */}
            {test.error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-[11px] text-red-400">
                {test.error}
              </div>
            )}

            {/* Output */}
            {test.result && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-atlas-text-muted">
                  <span>
                    Latency:{" "}
                    <span className="font-semibold text-atlas-text">
                      {test.result.latencyMs}ms
                    </span>
                  </span>
                  <span>
                    Tokens:{" "}
                    <span className="font-semibold text-atlas-text">
                      {test.result.tokensUsed}
                    </span>
                  </span>
                </div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-atlas-text-muted">
                  Output
                </h4>
                <pre className="max-h-[240px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-glass-border bg-black/30 p-3 font-mono text-[11px] leading-5 text-atlas-text">
                  {test.result.output || "(empty response)"}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default function PromptsPage() {
  return (
    <FeatureGate flagKey="super_admin">
      <PromptsContent />
    </FeatureGate>
  );
}
