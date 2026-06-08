import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, preview, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Select API Keys Error:', error);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    return NextResponse.json({ keys: data });
  } catch (err: any) {
    console.error('API Keys GET Error:', err);
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
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    // Generate a secure random 32-byte key
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    
    // Hash the key for storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    // Create a preview (first 12 chars + ... + last 4 chars)
    const preview = `${rawKey.substring(0, 12)}...${rawKey.substring(rawKey.length - 4)}`;

    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          user_id: userId,
          name,
          key_hash: keyHash,
          preview
        }
      ])
      .select('id, name, preview, created_at')
      .single();

    if (error || !data) {
      console.error('Supabase Insert API Key Error:', error);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Return the raw key ONLY ONCE
    return NextResponse.json({ success: true, key: data, rawKey }, { status: 201 });
  } catch (err: any) {
    console.error('API Keys POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase Delete API Key Error:', error);
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API Keys DELETE Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
