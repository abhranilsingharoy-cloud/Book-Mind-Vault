import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getPineconeIndex } from '../../../lib/pinecone';
import { auth } from '@clerk/nextjs/server';
import { openai as nativeOpenai } from '../../../lib/openai';

// Create a configured Vercel AI OpenAI instance
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Invalid request', { status: 400 });
    }

    const query = lastMessage.content;

    // 1. Embed the query
    const embeddingResponse = await nativeOpenai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Query Pinecone
    const pineconeIndex = getPineconeIndex();
    const queryResult = await pineconeIndex.namespace(userId).query({
      vector: queryEmbedding,
      topK: 8,
      includeMetadata: true,
    });

    const contextChunks = queryResult.matches.map((match: any) => {
      const meta = match.metadata;
      return `[Source: ${meta.title || 'Untitled'}, URL: ${meta.url}]\nExcerpt: ${meta.text}`;
    });

    const contextString = contextChunks.join('\n\n---\n\n');

    const systemPrompt = `You are the user's personal knowledge assistant for MindVault. Answer using ONLY the provided context. Cite which saved article each point comes from using [Source: title, url]. If the context doesn't contain the answer, say so — do not hallucinate.

CONTEXT LIBRARY:
${contextString}`;

    // 3. Stream the response using Vercel AI SDK
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: messages, // History included
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
