import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';

export class SummarizerService {
  private systemPrompt = `You are a precise knowledge extraction assistant for a personal Second Brain app. Your summaries help users recall why they saved content weeks later. Always be specific — never write generic summaries like 'This article discusses AI.' Instead write 'This article explains how RLHF training reduces LLM hallucinations by 40% using human preference datasets.'

Examples:
Input: [article about React Server Components]
Output: {
  "bullets": [
    "RSCs run on the server, eliminating client-side JS bundle for static content (0 bytes shipped)",
    "Use 'use client' directive only for interactive components — everything else defaults to server",
    "Fetch data directly in RSCs without useEffect or loading states — simplifies data fetching significantly"
  ]
}

Input: [research paper on transformer attention]
Output: {
  "bullets": [
    "Self-attention computes relevance between all word pairs in O(n²) — bottleneck for long sequences",
    "Multi-head attention runs 8 parallel attention functions, each learning different relationship types",
    "Positional encodings (sine/cosine) inject sequence order since transformers process tokens in parallel"
  ]
}`;

  private schema = z.object({
    bullets: z.array(z.string()).length(3, "Must be exactly 3 bullets"),
  });

  /**
   * Summarize content into exactly 3 bullets.
   * Returns a single newline-separated string.
   */
  public async summarize(title: string, textExcerpt: string): Promise<string> {
    const userPrompt = `Summarize this saved content in exactly 3 bullet points. Each bullet: under 25 words, begins with a specific fact or insight (not 'This article...' or 'The author...').
    
Content title: ${title}
Content: ${textExcerpt}`;

    try {
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: this.schema,
        system: this.systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
      });

      return object.bullets.map(b => `• ${b}`).join('\n');
    } catch (error) {
      console.error("Summarizer Error:", error);
      // Graceful degradation
      return "• Summary generation failed.\n• Please read the original content.\n• Or try re-analyzing later.";
    }
  }
}
