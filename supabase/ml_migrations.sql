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
