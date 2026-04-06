'use client';

import { useState, useCallback } from 'react';
import { api, ResearchResultData, TweetDraft } from '@/lib/api';

export type CraftingPhase = 'idle' | 'analyzing' | 'presenting' | 'generating' | 'complete';

export interface ContentAnalysis {
  summary: string;
  keyThemes: string[];
  sentiment: string;
  relatedTopics: string[];
  pageCount?: number;
}

export interface CraftingAngle {
  id: string;
  title: string;
  description: string;
  sampleOpener: string;
  tone: string;
  structure: 'tweet' | 'thread';
  angleInstruction: string;
}

interface CraftingAdvisorState {
  phase: CraftingPhase;
  analysis: ContentAnalysis | null;
  angles: CraftingAngle[];
  selectedAngleIds: Set<string>;
  generatedDrafts: TweetDraft[];
  error: string | null;
}

const INITIAL_STATE: CraftingAdvisorState = {
  phase: 'idle',
  analysis: null,
  angles: [],
  selectedAngleIds: new Set(),
  generatedDrafts: [],
  error: null,
};

function buildAngleInstruction(angle: CraftingAngle): string {
  return `${angle.title}: ${angle.description}. Open with something like: "${angle.sampleOpener}". Tone: ${angle.tone}.`;
}

function parseAnglesFromText(text: string): CraftingAngle[] {
  try {
    // Try to extract JSON array from oracle response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const raw = JSON.parse(match[0]);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((a: unknown) => a && typeof a === 'object')
      .map((a: Record<string, unknown>, i: number) => ({
        id: `angle-${i}`,
        title: String(a.title || ''),
        description: String(a.description || ''),
        sampleOpener: String(a.sampleOpener || ''),
        tone: String(a.tone || 'Analytical'),
        structure: (a.structure === 'thread' ? 'thread' : 'tweet') as 'tweet' | 'thread',
        angleInstruction: buildAngleInstruction({
          id: `angle-${i}`,
          title: String(a.title || ''),
          description: String(a.description || ''),
          sampleOpener: String(a.sampleOpener || ''),
          tone: String(a.tone || 'Analytical'),
          structure: a.structure === 'thread' ? 'thread' : 'tweet',
          angleInstruction: '',
        }),
      }));
  } catch {
    return [];
  }
}

function buildOraclePrompt(research: ResearchResultData, sourceContent: string): string {
  return `You are helping a crypto analyst decide how to tweet about content they've just read.

Here is the research analysis:
Summary: ${research.summary}
Key facts: ${research.keyFacts.join(', ')}
Sentiment: ${research.sentiment}
Related topics: ${research.relatedTopics.join(', ')}

Source content (first 2000 chars):
${sourceContent.slice(0, 2000)}

Generate exactly 4-5 tweet angles as a JSON array. Each angle should be:
{
  "title": "2-3 word label",
  "description": "One sentence pitch for this angle",
  "sampleOpener": "First 10-15 words of what the tweet would start with...",
  "tone": "Provocative" | "Analytical" | "Educational" | "Contrarian" | "Conversational",
  "structure": "tweet" | "thread"
}

Vary the tones. At least one should be contrarian. At least one should be data-driven.
The angles should be DIFFERENT from each other — not just rephrasing the same point.
Return ONLY the JSON array, no other text.`;
}

export function useCraftingAdvisor() {
  const [state, setState] = useState<CraftingAdvisorState>(INITIAL_STATE);

  const startAnalysis = useCallback(async (
    sourceContent: string,
    sourceType: string,
    pageCount?: number,
  ) => {
    if (!sourceContent.trim()) return;

    setState(prev => ({ ...prev, phase: 'analyzing', error: null }));

    try {
      // Step 1: Research the content
      const { result: research } = await api.research.conduct(
        sourceContent.slice(0, 500) // use first 500 chars as search query
      );

      const analysis: ContentAnalysis = {
        summary: research.summary,
        keyThemes: research.keyFacts.slice(0, 5),
        sentiment: research.sentiment,
        relatedTopics: research.relatedTopics,
        pageCount,
      };

      // Step 2: Generate angles via oracle
      const prompt = buildOraclePrompt(research, sourceContent);
      const { text } = await api.oracle.chat({
        messages: [{ role: 'user', content: prompt }],
        page: 'crafting',
      });

      const angles = parseAnglesFromText(text);

      if (angles.length === 0) {
        // Fallback: generate basic angles from research data
        const fallback: CraftingAngle[] = [
          {
            id: 'angle-0',
            title: 'Key Insight',
            description: research.keyFacts[0] || research.summary,
            sampleOpener: 'Here\'s what most people miss about this...',
            tone: 'Analytical',
            structure: 'tweet',
            angleInstruction: `Key Insight: ${research.keyFacts[0] || research.summary}. Tone: Analytical.`,
          },
          {
            id: 'angle-1',
            title: 'Hot Take',
            description: `A provocative take on the ${research.sentiment} sentiment`,
            sampleOpener: 'Everyone is wrong about this...',
            tone: 'Provocative',
            structure: 'tweet',
            angleInstruction: `Hot Take: Provocative angle on ${research.summary}. Tone: Provocative.`,
          },
        ];
        setState(prev => ({
          ...prev,
          phase: 'presenting',
          analysis,
          angles: fallback,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        phase: 'presenting',
        analysis,
        angles,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        phase: 'idle',
        error: err instanceof Error ? err.message : 'Analysis failed',
      }));
    }
  }, []);

  const toggleAngle = useCallback((id: string) => {
    setState(prev => {
      const next = new Set(prev.selectedAngleIds);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 5) {
        next.add(id);
      }
      return { ...prev, selectedAngleIds: next };
    });
  }, []);

  const addCustomAngle = useCallback((description: string) => {
    const id = `custom-${Date.now()}`;
    const angle: CraftingAngle = {
      id,
      title: 'Custom',
      description,
      sampleOpener: description.slice(0, 60),
      tone: 'Conversational',
      structure: 'tweet',
      angleInstruction: `Custom angle: ${description}. Tone: Conversational.`,
    };
    setState(prev => ({
      ...prev,
      angles: [...prev.angles, angle],
      selectedAngleIds: new Set(Array.from(prev.selectedAngleIds).concat(id)),
    }));
  }, []);

  const generateSelected = useCallback(async (
    sourceContent: string,
    sourceType: string,
    blendId?: string,
  ) => {
    const { selectedAngleIds, angles } = state;
    const selected = angles.filter(a => selectedAngleIds.has(a.id));
    if (selected.length === 0) return;

    setState(prev => ({ ...prev, phase: 'generating' }));

    try {
      const results = await Promise.all(
        selected.map(angle =>
          api.drafts.generate({
            sourceContent,
            sourceType,
            blendId,
            angleInstruction: angle.angleInstruction,
          })
        )
      );

      const drafts = results.map(r => r.draft);
      setState(prev => ({
        ...prev,
        phase: 'complete',
        generatedDrafts: drafts,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        phase: 'presenting',
        error: err instanceof Error ? err.message : 'Generation failed',
      }));
    }
  }, [state]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    startAnalysis,
    toggleAngle,
    addCustomAngle,
    generateSelected,
    reset,
  };
}
