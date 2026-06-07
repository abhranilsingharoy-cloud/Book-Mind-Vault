import { openai } from './openai';
import { getPineconeIndex } from './pinecone';

// Approximate 1 token ≈ 4 characters, 300 tokens ≈ 1200 characters
const CHUNK_SIZE_CHARS = 1200;

function chunkText(text: string): string[] {
  // Split by sentence boundaries roughly
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE_CHARS && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += sentence + ' ';
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function processIngestion(bookmarkId: string, userId: string, url: string, rawText: string) {
  const chunks = chunkText(rawText);
  
  if (chunks.length === 0) {
    throw new Error('No text chunks could be extracted.');
  }

  // 1. Generate Embeddings for all chunks
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks,
  });

  const embeddings = embeddingResponse.data;

  // 2. Upsert to Pinecone
  const pineconeIndex = getPineconeIndex();
  const pineconeIds: string[] = [];
  const vectors = embeddings.map((emb, index) => {
    const id = `${bookmarkId}-chunk-${index}`;
    pineconeIds.push(id);
    return {
      id,
      values: emb.embedding,
      metadata: {
        bookmarkId,
        userId,
        url,
        chunkIndex: index,
        text: chunks[index],
        date: new Date().toISOString(),
      },
    };
  });

  // Pinecone recommends batching but for a single article, a few chunks should fit in one request
  await pineconeIndex.namespace(userId).upsert(vectors);

  // 3. Generate Summary & Tags
  const prompt = `You are a helpful knowledge assistant. Analyze the following text extracted from a saved bookmark.
Provide:
1. A 3-bullet summary, each under 20 words. Be specific.
2. 5 semantic tags as a JSON array.

Text:
${rawText.substring(0, 3000)} // Using the first 3000 chars for summary

Return the response strictly as a JSON object with this shape:
{
  "summary": "bullet point 1\\nbullet point 2\\nbullet point 3",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an advanced AI reading assistant.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  });

  const aiResult = JSON.parse(completion.choices[0].message.content || '{}');

  return {
    summary: aiResult.summary || '',
    tags: aiResult.tags || [],
    pineconeIds,
  };
}
