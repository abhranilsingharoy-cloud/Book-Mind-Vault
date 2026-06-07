'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Send, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  "What did I save about machine learning?",
  "Summarize my recent bookmarks on productivity.",
  "How does React Server Components work based on my library?"
];

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSuggestionClick = (query: string) => {
    append({ role: 'user', content: query });
  };

  // Basic markdown link parser for citations
  const parseMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Very basic formatting for the demo
      if (line.includes('[Source:')) {
        return <span key={i} className="block text-primary text-sm mt-2 font-mono bg-primary/10 px-2 py-1 rounded inline-block">{line}</span>;
      }
      return <span key={i} className="block mb-2">{line}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-background/50 backdrop-blur-md z-10 flex items-center gap-3">
        <Sparkles className="text-secondary" />
        <h2 className="font-heading font-bold text-xl">Ask Your Library</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <BookOpen className="text-primary w-8 h-8" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-2">Ask anything about your knowledge</h3>
            <p className="text-textSecondary mb-8 max-w-md">
              MindVault will search through all your saved bookmarks, articles, and quotes to give you an exact answer.
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 text-sm transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            <AnimatePresence>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white/5 border border-white/10 rounded-bl-none'}`}>
                    <div className="leading-relaxed">
                      {parseMessageContent(m.content)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-3 text-textSecondary">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span className="text-sm font-mono animate-pulse">Searching your library...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-white/10 z-10">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your saved knowledge..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-primary text-white hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
