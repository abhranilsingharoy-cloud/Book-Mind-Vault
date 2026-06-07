-- Add Full-Text Search vector column to bookmarks (Module 2)
ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS fts_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_fts ON bookmarks USING gin(fts_vector);

-- Create Clusters table (Module 4)
-- Note: 'vector' type requires pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  centroid vector(1536), -- Assuming 1536 dims for text-embedding-3-small
  member_count INTEGER DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES clusters(id);

-- Create Bookmark Chunks table for pgvector (Module 1)
CREATE TABLE IF NOT EXISTS bookmark_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(768), -- Gemini uses 768 dims
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search (IVFFlat or HNSW)
-- Assuming we use HNSW for better performance on 768 dims:
CREATE INDEX ON bookmark_chunks USING hnsw (embedding vector_cosine_ops);

-- Create a function for similarity search (RPC)
CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id text
)
RETURNS TABLE (
  bookmark_id uuid,
  chunk_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  select
    bookmark_chunks.bookmark_id,
    bookmark_chunks.chunk_text,
    1 - (bookmark_chunks.embedding <=> query_embedding) as similarity
  from bookmark_chunks
  where bookmark_chunks.user_id = p_user_id
    and 1 - (bookmark_chunks.embedding <=> query_embedding) > match_threshold
  order by bookmark_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Optional: Token tracking table for billing/analytics
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_estimate_usd NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own clusters" ON clusters
  FOR ALL USING (auth.uid()::text = user_id);

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own token usage" ON token_usage
  FOR SELECT USING (auth.uid()::text = user_id);
