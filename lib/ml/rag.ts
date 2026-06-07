import { EmbeddingService, ChunkMetadata } from './embedding';
import { generateObject, streamText, generateText } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

export type QueryType = 'factual' | 'exploratory' | 'comparative' | 'temporal';

export class RAGEngine {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * SUB-COMPONENT A: Query Understanding
   */
  public async understandQuery(query: string): Promise<{ type: QueryType; expandedQuery: string }> {
    const classificationSchema = z.object({
      type: z.enum(['factual', 'exploratory', 'comparative', 'temporal']),
    });

    const classification = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: classificationSchema,
      prompt: `Classify this user query into one of: factual, exploratory, comparative, temporal.\nQuery: ${query}`,
    });

    let expandedQuery = query;
    const wordCount = query.split(/\s+/).length;

    // HyDE for short queries
    if (wordCount < 5) {
      const hydeResult = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Write a 2-sentence expert answer to: ${query}`,
      });
      expandedQuery = `${query}\n\n${hydeResult.text}`;
    }

    return { type: classification.object.type, expandedQuery };
  }

  /**
   * SUB-COMPONENT B: Contextual Retrieval & Cross-encoder re-ranking
   */
  public async retrieveContext(userId: string, expandedQuery: string, originalQuery: string): Promise<ChunkMetadata[]> {
    const vectors = await this.embeddingService.generateEmbeddings([expandedQuery]);
    // Retrieve top-12
    const top12 = await this.embeddingService.findRelated(userId, vectors[0], 12);

    // Cross-encoder re-ranking
    const ranked: { meta: ChunkMetadata, score: number }[] = [];
    
    // Process in parallel to reduce latency
    await Promise.all(top12.map(async (chunk) => {
      try {
        const result = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: z.object({ score: z.number().min(1).max(10) }),
          system: "Rate how relevant this text is to the question on a scale 1-10. Return ONLY the number.",
          prompt: `Question: '${originalQuery}'\nText: ${chunk.chunkText}`,
          temperature: 0,
        });
        if (result.object.score >= 6) {
          ranked.push({ meta: chunk, score: result.object.score });
        }
      } catch (e) {
        // Skip on error
      }
    }));

    // Sort descending, take top 5
    ranked.sort((a, b) => b.score - a.score);
    const top5 = ranked.slice(0, 5).map(r => r.meta);

    // Group by source bookmark (simple unique dedup based on bookmarkId)
    const uniqueBookmarks = new Map<string, ChunkMetadata>();
    top5.forEach(meta => {
      if (!uniqueBookmarks.has(meta.bookmarkId)) {
        uniqueBookmarks.set(meta.bookmarkId, meta);
      } else {
        // Append text if from same article
        const existing = uniqueBookmarks.get(meta.bookmarkId)!;
        existing.chunkText += `\n... ${meta.chunkText}`;
      }
    });

    return Array.from(uniqueBookmarks.values());
  }

  /**
   * SUB-COMPONENT C: Response Generation
   */
  public async generateStreamingResponse(userId: string, messages: any[]) {
    const lastMessage = messages[messages.length - 1].content;
    
    // A1. Understand
    const { type, expandedQuery } = await this.understandQuery(lastMessage);
    
    // B1. Retrieve
    const context = await this.retrieveContext(userId, expandedQuery, lastMessage);

    const contextString = context.map(c => `[from: ${c.title}]\n${c.chunkText}`).join('\n\n---\n\n');

    const systemPrompt = `You are the user's personal knowledge assistant — an expert who has read every article the user has ever saved. You have access to their curated knowledge base. Rules:
    (1) Answer ONLY from the provided context — never from your general training data
    (2) If the context doesn't contain the answer, say: 'I don't see anything in your saved content about that. Try saving some articles on this topic first.'
    (3) Always cite sources inline using [from: Title] notation
    (4) Be concise — 2-4 sentences unless the question requires more
    (5) At the end, suggest 1 related question the user might want to ask next, prefixed with 'You might also ask:'

    CONTEXT:
    ${contextString}`;

    const stream = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: messages,
    });

    return {
      stream,
      lastMessage,
      context
    };
  }

  /**
   * Generates follow-up question chips asynchronously
   */
  public async generateFollowUps(topic: string): Promise<string[]> {
    try {
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({ questions: z.array(z.string().max(60)).length(3) }),
        prompt: `Based on this answer about '${topic}', suggest 3 short follow-up questions (under 8 words each) the user might want to ask.`,
        temperature: 0.5,
      });
      return object.questions;
    } catch (e) {
      return [];
    }
  }
}
