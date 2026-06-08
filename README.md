# 🧠 Book Mind Vault - The AI-Powered Second Brain

Book Mind Vault is an intelligent, AI-powered bookmark manager and personal knowledge base. It goes beyond simply saving URLs by automatically extracting, summarizing, and categorizing your saved content, allowing you to visually explore your knowledge through an interactive 3D graph and chat with your library using advanced Retrieval-Augmented Generation (RAG).

![Book Mind Vault Architecture](https://img.shields.io/badge/Architecture-Next.js%2014%20App%20Router-blue)
![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20Pinecone-brightgreen)
![AI Models](https://img.shields.io/badge/AI-OpenAI%20gpt--4o--mini%20%7C%20text--embedding--3-orange)

## ✨ Core Features

*   **🌐 1-Click Save Extension**: A sleek Chrome Extension to instantly save content from anywhere on the web.
*   **🤖 AI Ingestion Pipeline**: Automatically crawls the URL, extracts clean text, and uses LLMs to generate a concise 3-bullet summary and precise semantic tags.
*   **🌌 3D Knowledge Graph**: Explore your saved content in a beautiful, interactive 3D space built with React Three Fiber and a force-directed layout. 
*   **🔍 Hybrid Semantic Search**: Find what you're looking for by *meaning*, not just keywords. Uses Reciprocal Rank Fusion (RRF) to combine Supabase pgvector search with PostgreSQL Full-Text Search.
*   **💬 "Ask Your Library" (RAG Chat)**: A conversational AI interface that strictly answers questions based on the context of your saved bookmarks, complete with inline citations and auto-generated follow-up questions.
*   **🧠 Topic Clustering Engine**: Automatically groups similar bookmarks into named clusters in real-time using Online K-Means.
*   **💡 Intelligent Memory System**: Prevents duplicate saves through semantic matching and automatically surfaces "Forgotten Gems" and "On This Day" memories.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
*   **3D Visualization**: React Three Fiber, Three.js, d3-force-3d
*   **Backend & Queue**: Next.js API Routes, BullMQ, Redis (for async background processing)
*   **Databases**: Supabase (PostgreSQL with pgvector & Full-Text Search)
*   **AI / ML**: Google Gemini (`gemini-1.5-flash`, `text-embedding-004`), Vercel AI SDK
*   **Storage**: Cloudflare R2 (for HTML snapshot caching)

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   A Supabase account
*   A Google AI Studio (Gemini) API Key
*   A local Redis instance (for BullMQ)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/abhranilsingharoy-cloud/Book-Mind-Vault.git
    cd Book-Mind-Vault
    ```

2.  **Install dependencies**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Environment Variables**
    Create a `.env.local` file in the root directory and add your keys:
    ```env
    # Authentication (Clerk)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key

    # Database (Supabase)
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

    # AI (Google Gemini - Free Tier)
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
    EMBEDDING_PROVIDER=google

    # Queue (Redis)
    REDIS_URL=redis://localhost:6379
    ```

4.  **Run Database Migrations**
    Execute the following SQL scripts in your Supabase SQL Editor in this order:
    1. `supabase/schema.sql` (Creates base tables)
    2. `supabase/ml_migrations.sql` (Adds pgvector and RRF functions)
    3. `supabase/disable_rls_fix.sql` (Disables RLS so our Clerk-protected Next.js backend can safely write data)

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000` to see the application.

6.  **Run the Background Worker** (In a separate terminal)
    ```bash
    npx tsx workers/ingestion.worker.ts
    ```

### Chrome Extension Setup
1. Navigate to the `extension/` directory.
2. Run `npm install` and `npm run build`.
3. Open Chrome, go to `chrome://extensions/`.
4. Enable "Developer mode" in the top right.
5. Click "Load unpacked" and select the `extension/dist/` folder.

---

**Designed and developed by Abhranil Singha Roy**
