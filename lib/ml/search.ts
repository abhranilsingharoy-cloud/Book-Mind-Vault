import { supabase } from '../supabase';
import { EmbeddingService, ChunkMetadata } from './embedding';

export interface SearchResult {
  bookmarkId: string;
  title: string;
  url: string;
  score: number;
  excerpt: string;
}

export class SearchEngine {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Hybrid Search: Combines Pinecone semantic search with Supabase FTS.
   * Merges results using Reciprocal Rank Fusion (RRF).
   */
  public async semanticSearch(
    userId: string,
    query: string,
    filters?: { collectionId?: string; tags?: string[]; dateRange?: [Date, Date] }
  ): Promise<SearchResult[]> {
    // 1. Semantic leg: Embed query and search Pinecone
    const queryEmbeddings = await this.embeddingService.generateEmbeddings([query]);
    const queryVector = queryEmbeddings[0];

    const semanticMatches = await this.embeddingService.findRelated(userId, queryVector, 20);

    // 2. Keyword leg: PostgreSQL FTS
    let ftsQuery = supabase
      .from('bookmarks')
      .select('id, title, url, summary, saved_at, click_count, collection_id')
      .eq('user_id', userId)
      .textSearch('fts_vector', query, { config: 'english', type: 'websearch' })
      .limit(20);

    // Apply filters to DB query
    if (filters?.collectionId) {
      ftsQuery = ftsQuery.eq('collection_id', filters.collectionId);
    }

    const { data: keywordMatches, error } = await ftsQuery;
    if (error) console.error("FTS Error:", error);

    // 3. Reciprocal Rank Fusion (RRF)
    const k = 60;
    const rrfScores = new Map<string, { score: number; meta: any; source: 'semantic'|'keyword'|'both' }>();

    // Process Semantic Matches
    semanticMatches.forEach((match, index) => {
      const rank = index + 1;
      const rrf = 1 / (k + rank);
      rrfScores.set(match.bookmarkId, { score: rrf, meta: match, source: 'semantic' });
    });

    // Process Keyword Matches
    (keywordMatches || []).forEach((match, index) => {
      const rank = index + 1;
      const rrf = 1 / (k + rank);
      
      const existing = rrfScores.get(match.id);
      if (existing) {
        existing.score += rrf;
        existing.source = 'both';
      } else {
        rrfScores.set(match.id, { 
          score: rrf, 
          meta: { 
            bookmarkId: match.id, 
            title: match.title, 
            url: match.url, 
            chunkText: match.summary, 
            savedAt: new Date(match.saved_at).getTime(),
            collectionId: match.collection_id,
            clickCount: match.click_count || 0
          }, 
          source: 'keyword' 
        });
      }
    });

    // 4. Additional Re-ranking Signals
    const now = Date.now();
    const rankedResults: SearchResult[] = [];

    Array.from(rrfScores.values()).forEach(item => {
      let finalScore = item.score;
      const meta = item.meta;

      // Recency boost (0 to 90 days)
      const daysOld = (now - (meta.savedAt || now)) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0, 1 - (daysOld / 90));
      finalScore *= (1 + 0.3 * recencyFactor);

      // User engagement boost
      if (meta.clickCount && meta.clickCount > 0) {
        finalScore *= 1.2;
      }

      // Collection match boost
      if (filters?.collectionId && meta.collectionId === filters.collectionId) {
        finalScore *= 1.15;
      }

      rankedResults.push({
        bookmarkId: meta.bookmarkId,
        title: meta.title,
        url: meta.url,
        score: finalScore,
        excerpt: this.highlightExcerpt(meta.chunkText || '', query)
      });
    });

    // Sort descending by RRF score and return top 10
    rankedResults.sort((a, b) => b.score - a.score);
    return rankedResults.slice(0, 10);
  }

  /**
   * Simple highlighter for the matching query terms
   */
  private highlightExcerpt(text: string, query: string): string {
    if (!text) return '';
    const terms = query.split(/\s+/).filter(t => t.length > 2);
    let highlighted = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return highlighted;
  }
}
