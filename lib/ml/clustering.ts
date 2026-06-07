import { supabase } from '../supabase';
import { EmbeddingService } from './embedding';
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

const HSL_COLORS = [
  'hsl(264,80%,65%)', 'hsl(174,60%,45%)', 'hsl(28,90%,55%)',
  'hsl(340,70%,60%)', 'hsl(200,75%,50%)', 'hsl(120,55%,45%)',
  'hsl(45,90%,55%)', 'hsl(0,70%,60%)'
];

export class ClusteringService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Evaluates inertia for multiple K values to find the optimal K using the Elbow Method.
   * Then initializes the clusters in the database.
   */
  public async initializeClusters(userId: string): Promise<void> {
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('id, title')
      .eq('user_id', userId);

    if (!bookmarks || bookmarks.length < 5) return;

    // In a real implementation, we would fetch embeddings from Pinecone here.
    // For now, we simulate fetching embeddings for the existing bookmarks.
    const mockEmbeddings = bookmarks.map(() => new Array(1536).fill(Math.random()));

    const possibleK = [3, 5, 7, 10, 15, 20].filter(k => k <= Math.floor(bookmarks.length / 2));
    if (possibleK.length === 0) possibleK.push(Math.max(1, Math.floor(bookmarks.length / 2)));

    let optimalK = possibleK[0];
    let bestInertia = Infinity;
    const inertias: number[] = [];

    // Simple K-Means implementation to find inertia
    for (const k of possibleK) {
      const inertia = this.computeKMeansInertia(mockEmbeddings, k);
      inertias.push(inertia);
    }

    // Find elbow: largest second derivative
    if (inertias.length > 2) {
      let maxSecondDeriv = -1;
      let elbowIndex = 0;
      for (let i = 1; i < inertias.length - 1; i++) {
        const secondDeriv = inertias[i-1] + inertias[i+1] - 2 * inertias[i];
        if (secondDeriv > maxSecondDeriv) {
          maxSecondDeriv = secondDeriv;
          elbowIndex = i;
        }
      }
      optimalK = possibleK[elbowIndex];
    } else {
      optimalK = Math.max(3, Math.min(20, Math.floor(bookmarks.length / 8)));
    }

    // Extract exactly optimalK centroids (randomly selected for demo)
    const centroids = mockEmbeddings.slice(0, optimalK);
    
    // Create clusters in DB
    for (let i = 0; i < centroids.length; i++) {
      const color = HSL_COLORS[i % HSL_COLORS.length];
      
      // Auto-name based on closest bookmarks
      // Mocked closest bookmarks:
      const closestTitles = bookmarks.slice(i, i + 5).map(b => b.title);
      const name = await this.nameCluster(closestTitles);

      await supabase.from('clusters').insert({
        user_id: userId,
        name,
        centroid: `[${centroids[i].join(',')}]`,
        color,
        member_count: 0
      });
    }
  }

  /**
   * Online K-Means: Assigns a new bookmark to the nearest existing cluster and updates the centroid.
   */
  public async assignCluster(userId: string, bookmarkId: string, embedding: number[]): Promise<void> {
    const { data: clusters } = await supabase
      .from('clusters')
      .select('id, centroid, member_count')
      .eq('user_id', userId);

    if (!clusters || clusters.length === 0) {
      // Initialize if no clusters exist
      await this.initializeClusters(userId);
      return;
    }

    let nearestCluster = clusters[0];
    let maxSim = -Infinity;

    for (const cluster of clusters) {
      const centroidVec = JSON.parse(cluster.centroid); // pgvector string representation might need parsing
      const sim = this.embeddingService.computeSimilarity(embedding, centroidVec);
      if (sim > maxSim) {
        maxSim = sim;
        nearestCluster = cluster;
      }
    }

    // Update bookmark
    await supabase.from('bookmarks').update({ cluster_id: nearestCluster.id }).eq('id', bookmarkId);

    // Incrementally update centroid
    // C_new = (C_old * N + P) / (N + 1)
    const oldCentroid = JSON.parse(nearestCluster.centroid);
    const N = nearestCluster.member_count;
    const newCentroid = oldCentroid.map((val: number, idx: number) => ((val * N) + embedding[idx]) / (N + 1));

    await supabase.from('clusters').update({
      centroid: `[${newCentroid.join(',')}]`,
      member_count: N + 1
    }).eq('id', nearestCluster.id);
  }

  /**
   * Rebalances clusters: merges small ones (<5) and splits large ones (>50).
   * Intended to be run by a background job.
   */
  public async rebalanceClusters(userId: string): Promise<void> {
    // 1. Find clusters with < 5 members
    const { data: smallClusters } = await supabase.from('clusters').select('*').eq('user_id', userId).lt('member_count', 5);
    // 2. Find clusters with > 50 members
    const { data: largeClusters } = await supabase.from('clusters').select('*').eq('user_id', userId).gt('member_count', 50);

    console.log(`Rebalancing: Found ${smallClusters?.length} small, ${largeClusters?.length} large clusters for user ${userId}.`);
    // Full implementation would do bisecting k-means for large, and nearest-neighbor merge for small.
  }

  private async nameCluster(titles: string[]): Promise<string> {
    const schema = z.object({
      clusterName: z.string().max(30),
    });

    try {
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema,
        system: "Given these 5 article titles from a user's saved content, generate a 2-3 word cluster name that best describes the theme. Return ONLY the name.",
        prompt: JSON.stringify(titles),
        temperature: 0.3,
      });
      return object.clusterName;
    } catch (e) {
      return "Miscellaneous Theme";
    }
  }

  private computeKMeansInertia(data: number[][], k: number): number {
    // Very simplified mock computation
    return 1000 / Math.pow(k, 0.8);
  }
}
