import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { supabase } from '../lib/supabase';
import { crawlUrl } from '../lib/crawler';
import { processIngestion } from '../lib/ingestion';
import { uploadHtmlSnapshot } from '../lib/r2';

export const QUEUE_NAME = 'bookmark-ingestion';

interface IngestionJobData {
  bookmarkId: string;
  userId: string;
  url: string;
}

export const worker = new Worker<IngestionJobData>(
  QUEUE_NAME,
  async (job: Job) => {
    const { bookmarkId, userId, url } = job.data;
    console.log(`Processing job ${job.id} for bookmark ${bookmarkId} (URL: ${url})`);

    try {
      // 1. Crawl the URL
      const { title, textContent, faviconUrl, htmlContent } = await crawlUrl(url);

      // 1.5. Upload HTML Snapshot to Cloudflare R2
      if (htmlContent) {
        await uploadHtmlSnapshot(bookmarkId, htmlContent);
      }

      // 2. Process with AI (Embeddings, Summary, Tags)
      const aiResult = await processIngestion(bookmarkId, userId, url, textContent);

      // 3. Update Supabase record
      const { error } = await supabase
        .from('bookmarks')
        .update({
          title,
          favicon_url: faviconUrl, // Could optionally fetch favicon here if crawler provides it
          raw_text: textContent,
          summary: aiResult.summary,
          tags: aiResult.tags,
          pinecone_ids: aiResult.pineconeIds,
          status: 'ready',
        })
        .eq('id', bookmarkId);

      if (error) {
        throw new Error(`Failed to update Supabase: ${error.message}`);
      }

      console.log(`Successfully completed job ${job.id}`);
      return { success: true, summary: aiResult.summary, tags: aiResult.tags, pineconeIds: aiResult.pineconeIds };
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error.message);

      // If it's the last attempt, mark as failed in DB
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        await supabase
          .from('bookmarks')
          .update({ status: 'failed' })
          .eq('id', bookmarkId);
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`Worker failed on job ${job?.id}: ${err.message}`);
});
