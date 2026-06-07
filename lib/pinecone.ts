import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY!;
const indexName = process.env.PINECONE_INDEX_NAME || 'mindvault-embeddings';

if (!apiKey) {
  console.warn('Missing PINECONE_API_KEY environment variable');
}

export const pinecone = new Pinecone({
  apiKey: apiKey || '',
});

export const getPineconeIndex = () => {
  return pinecone.Index(indexName);
};
