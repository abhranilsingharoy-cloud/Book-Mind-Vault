import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BookMindVaultAI } from '../../../lib/ml/orchestrator';

const ai = new BookMindVaultAI();

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();
    if (!messages || messages.length === 0) {
      return new Response('Invalid request', { status: 400 });
    }

    // Uses the new RAG engine which handles Gemini LLM and Supabase pgvector retrieval
    const { stream } = await ai.onChatMessage(userId, messages);

    return stream.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
