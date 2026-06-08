import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Select Collections Error:', error);
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
    }

    // Now get counts for each collection
    // This could be optimized with a SQL function or view, but doing it here for simplicity
    const collectionsWithCounts = await Promise.all(data.map(async (collection) => {
      const { count, error: countError } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collection.id)
        .eq('user_id', userId);
        
      return {
        ...collection,
        count: countError ? 0 : count || 0
      };
    }));

    return NextResponse.json({ collections: collectionsWithCounts });
  } catch (err: any) {
    console.error('Collections API GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('collections')
      .insert([
        {
          user_id: userId,
          name,
          color: color || 'from-primary to-secondary'
        }
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase Insert Collection Error:', error);
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, collection: data }, { status: 201 });
  } catch (err: any) {
    console.error('Collections API POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
