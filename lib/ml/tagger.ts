import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { EmbeddingService } from './embedding';

export class TaggerService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  // A small subset of 500 tech terms for demonstration
  private TECH_KEYWORDS = ['react', 'python', 'docker', 'kubernetes', 'typescript', 'javascript', 'next.js', 'sql', 'postgres', 'machine learning', 'ai', 'llm', 'css'];

  /**
   * Stage 1: Fast zero-shot classification using heuristics.
   */
  public generateFastTags(url: string, title: string, textExcerpt: string): string[] {
    const tags = new Set<string>();
    const content = `${title} ${textExcerpt}`.toLowerCase();

    // 1. Domain extraction
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname.replace('www.', '');
      if (domain === 'github.com') tags.add('open-source');
      else tags.add(domain.split('.')[0]); // e.g., 'medium'
    } catch (e) {
      // invalid URL, skip
    }

    // 2. Content-type detection
    if (content.includes('paper') || content.includes('arxiv') || content.includes('abstract')) {
      tags.add('research');
    } else if (content.includes('tutorial') || content.includes('how to') || content.includes('guide')) {
      tags.add('tutorial');
    } else if (content.includes('news') || content.includes('breaking')) {
      tags.add('news');
    }

    // 3. Technology detection
    for (const kw of this.TECH_KEYWORDS) {
      if (content.includes(kw)) {
        tags.add(kw.replace(' ', '-'));
      }
    }

    return Array.from(tags).slice(0, 3);
  }

  /**
   * Stage 2: LLM Semantic Tagging.
   */
  public async generateSemanticTags(textExcerpt: string): Promise<string[]> {
    const schema = z.object({
      tags: z.array(z.string()).length(5),
    });

    try {
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema,
        system: "You are a knowledge taxonomy expert. Generate exactly 5 tags for this saved content. Rules: (1) tags are lowercase, hyphenated if multi-word, (2) mix specific (react-hooks) and broad (javascript) tags, (3) include the primary topic, medium (tutorial/paper/news), and skill level (beginner/intermediate/advanced) when detectable, (4) return ONLY a JSON array of strings.",
        prompt: `Content to tag:\n${textExcerpt.substring(0, 3000)}`,
        temperature: 0.1,
      });

      return object.tags;
    } catch (error) {
      console.error("Tagger LLM Error:", error);
      return [];
    }
  }

  /**
   * Combine fast tags and LLM tags, deduplicate, limit to 7.
   */
  public async generateAllTags(url: string, title: string, textExcerpt: string): Promise<string[]> {
    const fastTags = this.generateFastTags(url, title, textExcerpt);
    // Don't wait for LLM if we just want fast tags? The prompt says: "Merge both stages, deduplicate, return up to 7 final tags."
    const llmTags = await this.generateSemanticTags(textExcerpt);

    const merged = Array.from(new Set([...fastTags, ...llmTags].map(t => t.toLowerCase().trim())));
    return merged.slice(0, 7);
  }

  /**
   * Suggests which collection a bookmark belongs to based on embedding similarity.
   */
  public async suggestCollections(bookmarkText: string, collections: {id: string, name: string, description?: string}[]): Promise<string[]> {
    if (!collections.length) return [];

    const bookmarkVector = (await this.embeddingService.generateEmbeddings([bookmarkText]))[0];
    const collectionVectors = await this.embeddingService.generateEmbeddings(collections.map(c => `${c.name} ${c.description || ''}`));

    const scored = collections.map((col, i) => ({
      id: col.id,
      score: this.embeddingService.computeSimilarity(bookmarkVector, collectionVectors[i])
    }));

    // Return collections with high similarity
    return scored.filter(c => c.score > 0.7).sort((a, b) => b.score - a.score).map(c => c.id);
  }
}
