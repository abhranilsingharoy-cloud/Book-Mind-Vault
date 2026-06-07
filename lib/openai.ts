import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY!;

if (!apiKey) {
  console.warn('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: apiKey || '',
});
