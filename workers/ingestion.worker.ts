import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { supabase } from '../lib/supabase';
import { BookMindVaultAI } from '../lib/ml/orchestrator';

export const QUEUE_NAME = 'bookmark-ingestion';
const ai = new BookMindVaultAI();

interface IngestionJobData {
  bookmarkId: string;
  userId: string;
  url: string;
}

export const worker = new Worker<IngestionJobData>(
  QUEUE_NAME,
  async (job: Job) => {
    const { bookmarkId, userId, url } = job.data;
    console.log(`Processing job ${job.id} for bookmark ${bookmarkId}`);
    try {
      await ai.onBookmarkSaved(userId, url);
      return { success: true };
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error.message);
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        await supabase.from('bookmarks').update({ status: 'failed' }).eq('id', bookmarkId);
      }
      throw error;
    }
  },
  { 
    connection: redis as any,
    concurrency: 5,
    limiter: {
      max: 14, // Max 14 jobs per minute to stay under the 15 RPM Gemini Free Tier limit (leaving 1 for chat)
      duration: 60000, // 60 seconds
    }
  }
);

worker.on('failed', (job, err) => {
  console.error(`Worker failed on job ${job?.id}: ${err.message}`);
});
