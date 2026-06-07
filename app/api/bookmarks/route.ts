import { NextRequest, NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import { redis } from '../../../lib/redis';
import { supabase } from '../../../lib/supabase';
import { QUEUE_NAME } from '../../../workers/ingestion.worker';

// Get user info from Clerk header or auth context. For now, mocking or using custom auth parsing depending on implementation.
import { auth } from '@clerk/nextjs/server';

const ingestionQueue = new Queue(QUEUE_NAME, { connection: redis });

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, title, selectedText } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Insert initial record in Supabase
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: userId,
          url,
          title: title || '',
          status: 'processing',
          raw_text: selectedText || null // If it's a quote clip
        }
      ])
      .select('id')
      .single();

    if (error || !data) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: 'Failed to create bookmark record' }, { status: 500 });
    }

    const bookmarkId = data.id;

    // Add job to BullMQ queue
    await ingestionQueue.add(
      'process-url',
      { bookmarkId, userId, url },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    return NextResponse.json({ success: true, bookmarkId, status: 'processing' }, { status: 201 });
  } catch (err: any) {
    console.error('Bookmarks API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase Select Error:', error);
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: data });
  } catch (err: any) {
    console.error('Bookmarks API GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
