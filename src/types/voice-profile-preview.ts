export interface BlendPreviewVoice {
  handle: string;
  percentage: number;
}

export interface BlendPreviewRequest {
  blend: {
    voices: BlendPreviewVoice[];
    dimensions?: Record<string, number>;
  };
  prompts: string[];
}

export interface BlendPreviewResult {
  mode: "live" | "mock";
  tweets: Array<{
    prompt: string;
    text: string;
  }>;
}
