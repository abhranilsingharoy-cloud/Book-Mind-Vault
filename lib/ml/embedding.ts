import { supabase } from '../supabase';
import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';

export type EmbeddingProvider = 'google' | 'ollama' | 'cohere';

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

  constructor() {
    this.provider = (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || 'google';
  }

  /**
   * Split text into overlapping chunks based on sentence boundaries.
   * Target: ~300 tokens (1200 chars), Min: 50 tokens (200 chars).
   * Overlap: 1 sentence.
   */
  public chunkText(text: string): string[] {
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    const TARGET_CHARS = 1200; 
    const MIN_CHARS = 200;     
    
    const chunks: string[] = [];
    let currentChunkSentences: string[] = [];
    let currentLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      currentChunkSentences.push(sentence);
      currentLength += sentence.length + 1;

      if (currentLength >= TARGET_CHARS) {
        chunks.push(currentChunkSentences.join(' ').trim());
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

      if (this.provider === 'google') {
        const { embeddings: batchEmbeddings } = await embedMany({
          model: google.embedding('text-embedding-004'),
          values: batch,
        });
        embeddings.push(...batchEmbeddings);
      } else if (this.provider === 'ollama') {
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
        console.warn('Cohere not fully implemented, falling back to mock zeros.');
        embeddings.push(...batch.map(() => new Array(768).fill(0)));
      }
    }

    return embeddings;
  }

  /**
   * Upserts text chunks and their embeddings into Supabase pgvector table.
   */
  public async upsertChunks(userId: string, metadataList: ChunkMetadata[], vectors: number[][]): Promise<void> {
    if (metadataList.length !== vectors.length) throw new Error("Metadata and vectors length mismatch");

    const rows = vectors.map((vec, i) => {
      const meta = metadataList[i];
      return {
        bookmark_id: meta.bookmarkId,
        user_id: meta.userId,
        chunk_index: meta.chunkIndex,
        chunk_text: meta.chunkText,
        embedding: `[${vec.join(',')}]`,
      };
    });

    // Batch insert into Supabase
    const { error } = await supabase.from('bookmark_chunks').insert(rows);
    if (error) throw error;
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
   * Queries Supabase pgvector using the match_chunks RPC function.
   */
  public async findRelated(userId: string, queryVector: number[], topK: number = 5): Promise<ChunkMetadata[]> {
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: `[${queryVector.join(',')}]`,
      match_threshold: 0.5,
      match_count: topK,
      p_user_id: userId
    });

    if (error) {
      console.error("RPC match_chunks Error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      bookmarkId: row.bookmark_id,
      chunkText: row.chunk_text,
      // The RPC only returns limited fields; in a real app you might join with bookmarks table to get full metadata.
      userId: userId,
      url: '', title: '', chunkIndex: 0, totalChunks: 0, domain: '', savedAt: 0, contentType: ''
    } as ChunkMetadata));
  }
}
