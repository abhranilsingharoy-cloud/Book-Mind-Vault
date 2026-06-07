import { openai } from '../openai';
import { getPineconeIndex } from '../pinecone';
import { supabase } from '../supabase';

export type EmbeddingProvider = 'openai' | 'ollama' | 'cohere';

export interface ChunkMetadata {
  bookmarkId: string;
  userId: string;
  url: string;
  title: string;
  chunkIndex: number;
  totalChunks: number;
  chunkText: string;
  domain: string;
  savedAt: number;
  topicCluster?: string;
  contentType: string;
}

export class EmbeddingService {
  private provider: EmbeddingProvider;
  private pineconeIndex = getPineconeIndex();

  constructor() {
    this.provider = (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || 'openai';
  }

  /**
   * Split text into overlapping chunks based on sentence boundaries.
   * Target: ~300 tokens (1200 chars), Min: 50 tokens (200 chars).
   * Overlap: 1 sentence.
   */
  public chunkText(text: string): string[] {
    // a. Split into sentences handling abbreviations
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    const TARGET_CHARS = 1200; // ~300 tokens
    const MIN_CHARS = 200;     // ~50 tokens
    
    const chunks: string[] = [];
    let currentChunkSentences: string[] = [];
    let currentLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      currentChunkSentences.push(sentence);
      currentLength += sentence.length + 1;

      if (currentLength >= TARGET_CHARS) {
        chunks.push(currentChunkSentences.join(' ').trim());
        // c. Overlap: carry the last 1 sentence
        const lastSentence = currentChunkSentences[currentChunkSentences.length - 1];
        currentChunkSentences = [lastSentence];
        currentLength = lastSentence.length + 1;
      }
    }

    if (currentLength > MIN_CHARS) {
      chunks.push(currentChunkSentences.join(' ').trim());
    }

    return chunks;
  }

  /**
   * Generate embeddings using the configured provider.
   * Batch processing: max 100 per call.
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      if (this.provider === 'openai') {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });
        embeddings.push(...response.data.map(d => d.embedding));
      } else if (this.provider === 'ollama') {
        // Implementation for local Ollama nomic-embed-text
        // This requires an http call to localhost:11434/api/embeddings
        for (const text of batch) {
          const res = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'nomic-embed-text', prompt: text })
          });
          const data = await res.json();
          embeddings.push(data.embedding);
        }
      } else if (this.provider === 'cohere') {
        // Mock Cohere implementation
        console.warn('Cohere not fully implemented, falling back to mock zeros.');
        embeddings.push(...batch.map(() => new Array(1536).fill(0)));
      }
    }

    return embeddings;
  }

  public async upsertChunks(userId: string, metadataList: ChunkMetadata[], vectors: number[][]): Promise<void> {
    if (metadataList.length !== vectors.length) throw new Error("Metadata and vectors length mismatch");

    const pineconeVectors = vectors.map((vec, i) => {
      const meta = metadataList[i];
      return {
        id: `${meta.bookmarkId}-chunk-${meta.chunkIndex}`,
        values: vec,
        metadata: { ...meta, savedAt: meta.savedAt } // ensure types match
      };
    });

    // Batch upsert to Pinecone
    const BATCH_SIZE = 100;
    for (let i = 0; i < pineconeVectors.length; i += BATCH_SIZE) {
      const batch = pineconeVectors.slice(i, i + BATCH_SIZE);
      await this.pineconeIndex.namespace(userId).upsert(batch);
    }
  }

  /**
   * Cosine similarity between two vectors.
   */
  public computeSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Queries Pinecone for the most similar bookmarks.
   */
  public async findRelated(userId: string, queryVector: number[], topK: number = 5): Promise<ChunkMetadata[]> {
    const results = await this.pineconeIndex.namespace(userId).query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    });

    return results.matches.map(m => m.metadata as unknown as ChunkMetadata);
  }
}
