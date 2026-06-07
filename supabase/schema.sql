CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  favicon_url TEXT,
  raw_text TEXT,
  summary TEXT,
  tags TEXT[],
  collection_id UUID REFERENCES collections(id),
  pinecone_ids TEXT[],
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming Clerk user_id maps to user_id column)
CREATE POLICY "Users can manage their own collections" ON collections
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid()::text = user_id);
