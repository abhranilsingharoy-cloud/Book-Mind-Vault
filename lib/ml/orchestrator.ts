import { EmbeddingService, ChunkMetadata } from './embedding';
import { SearchEngine, SearchResult } from './search';
import { SummarizerService } from './summarizer';
import { TaggerService } from './tagger';
import { ClusteringService } from './clustering';
import { RAGEngine } from './rag';
import { RecommendationSystem } from './recommendation';
import { crawlUrl } from '../crawler'; // Assuming this exists from core implementation

export class BookMindVaultAI {
  private embedding: EmbeddingService;
  private search: SearchEngine;
  private summarizer: SummarizerService;
  private tagger: TaggerService;
  private clustering: ClusteringService;
  private rag: RAGEngine;
  private recommendations: RecommendationSystem;

  constructor() {
    this.embedding = new EmbeddingService();
    this.search = new SearchEngine();
    this.summarizer = new SummarizerService();
    this.tagger = new TaggerService();
    this.clustering = new ClusteringService();
    this.rag = new RAGEngine();
    this.recommendations = new RecommendationSystem();
  }

  /**
   * Orchestrates the entire ingestion pipeline:
   * Dedup -> Crawl -> Embed -> Summarize -> Tag -> Cluster -> Store
   */
  public async onBookmarkSaved(userId: string, url: string, providedTitle?: string): Promise<any> {
    const titleToDedup = providedTitle || url;
    
    // 1. Dedup check
    const dedup = await this.recommendations.checkDuplicate(userId, url, titleToDedup);
    if (dedup.blockSave) {
      throw new Error(`Duplicate detected: similarity ${dedup.similarity} with ${dedup.similar?.title}`);
    }

    // 2. Crawl
    const { title, textContent, faviconUrl, htmlContent } = await crawlUrl(url);

    // 3. Summarize & Tag (Parallel)
    const [summary, tags] = await Promise.all([
      this.summarizer.summarize(title, textContent),
      this.tagger.generateAllTags(url, title, textContent)
    ]);

    // 4. Chunk & Embed
    const chunks = this.embedding.chunkText(textContent);
    const vectors = await this.embedding.generateEmbeddings(chunks);
    
    const bookmarkId = crypto.randomUUID();
    const savedAt = Date.now();

    const metadataList: ChunkMetadata[] = chunks.map((chunkText, i) => ({
      bookmarkId,
      userId,
      url,
      title,
      chunkIndex: i,
      totalChunks: chunks.length,
      chunkText,
      domain: new URL(url).hostname,
      savedAt,
      contentType: tags.includes('research') ? 'article' : 'webpage'
    }));

    await this.embedding.upsertChunks(userId, metadataList, vectors);

    // 5. Assign to Cluster
    // Represent the bookmark by its first chunk's vector
    await this.clustering.assignCluster(userId, bookmarkId, vectors[0]);

    return { bookmarkId, title, summary, tags, isWarning: dedup.isDuplicate };
  }

  /**
   * Orchestrates semantic + keyword search
   */
  public async onSearchQuery(userId: string, query: string, filters?: any): Promise<SearchResult[]> {
    return this.search.semanticSearch(userId, query, filters);
  }

  /**
   * Orchestrates RAG Chat
   */
  public async onChatMessage(userId: string, messages: any[]): Promise<any> {
    return this.rag.generateStreamingResponse(userId, messages);
  }

  /**
   * Generates Daily Digest for memory surfacing
   */
  public async getDailyDigest(userId: string): Promise<any> {
    const [temporal, collab] = await Promise.all([
      this.recommendations.generateTemporalMemory(userId),
      this.recommendations.getCollaborativeRecommendations(userId)
    ]);

    return {
      temporal,
      collaborative: collab
    };
  }
}
