import { supabase } from '../supabase';
import { EmbeddingService } from './embedding';
import cron from 'node-cron';

export class RecommendationSystem {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * FEATURE A: "You saved this before" deduplication
   */
  public async checkDuplicate(userId: string, url: string, title: string): Promise<{ isDuplicate: boolean; similar?: any; similarity?: number; blockSave: boolean }> {
    // 1. Exact URL match
    const { data: exactMatch } = await supabase.from('bookmarks').select('*').eq('url', url).eq('user_id', userId).single();
    if (exactMatch) {
      return { isDuplicate: true, similar: exactMatch, similarity: 1.0, blockSave: true };
    }

    // 2. Semantic title match against existing
    const titleVector = (await this.embeddingService.generateEmbeddings([title]))[0];
    
    // In production, we would use Pinecone to find nearest neighbors based on the title vector.
    // For simplicity, we assume we fetch the nearest 1 neighbor via Pinecone.
    const nearest = await this.embeddingService.findRelated(userId, titleVector, 1);
    
    if (nearest.length > 0) {
      // Re-compute exact similarity or fetch it from pinecone results (if included)
      // Here we simulate the score
      const highestScore = 0.85; // Simulated score
      const simMatch = nearest[0];

      if (highestScore > 0.92) {
        return { isDuplicate: true, similar: simMatch, similarity: highestScore, blockSave: true };
      } else if (highestScore >= 0.80) {
        return { isDuplicate: true, similar: simMatch, similarity: highestScore, blockSave: false };
      }
    }

    return { isDuplicate: false, blockSave: false };
  }

  /**
   * FEATURE B: Temporal memory surfacing
   * Returns items for the daily digest.
   */
  public async generateTemporalMemory(userId: string): Promise<any> {
    const now = new Date();
    const digest: any = { onThisDay: [], forgottenGems: [] };

    // 1. "On this day" (Simplified to 1 month ago)
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const { data: onThisDay } = await supabase
      .from('bookmarks')
      .select('id, title, url, saved_at')
      .eq('user_id', userId)
      .gte('saved_at', new Date(oneMonthAgo.setHours(0,0,0,0)).toISOString())
      .lte('saved_at', new Date(oneMonthAgo.setHours(23,59,59,999)).toISOString());
    
    if (onThisDay) digest.onThisDay = onThisDay;

    // 2. "Forgotten gems"
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const { data: forgotten } = await supabase
      .from('bookmarks')
      .select('id, title, url')
      .eq('user_id', userId)
      .eq('click_count', 0)
      .lte('saved_at', fourteenDaysAgo.toISOString())
      .limit(3);

    if (forgotten) digest.forgottenGems = forgotten;

    return digest;
  }

  /**
   * FEATURE C: Collaborative filtering
   */
  public async getCollaborativeRecommendations(userId: string): Promise<any[]> {
    // 1. Find overlapping clusters between users (mocked)
    // In production: compare user's cluster centroids with other public cluster centroids.
    // Return items saved by others in those clusters.
    
    const { data: recs } = await supabase
      .from('bookmarks')
      .select('id, title, url, cluster_id')
      .neq('user_id', userId)
      .eq('is_public', true) // assuming explicit opt-in
      .limit(3);
    
    return recs || [];
  }

  /**
   * Initialize scheduled jobs (Cron)
   */
  public startCronJobs() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily digest temporal surfacing job...');
      // Fetch all users, generate digest, send notifications (e.g., via email or push)
    });
  }
}
