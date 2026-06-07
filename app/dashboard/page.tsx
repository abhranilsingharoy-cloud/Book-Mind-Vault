'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';

// Dynamically import 3D graph to avoid SSR issues
const KnowledgeGraph3D = dynamic(() => import('../../components/KnowledgeGraph3D'), { ssr: false });

export default function DashboardPage() {
  const [searchActive, setSearchActive] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* Search Trigger (Thought Portal) */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
        <button 
          onClick={() => setSearchActive(true)}
          className="flex items-center gap-3 px-6 py-3 glass-card hover:bg-white/10 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300 w-96 max-w-[90vw]"
        >
          <Search className="text-secondary" size={20} />
          <span className="text-textSecondary font-mono text-sm">Cmd+K or click to search your mind...</span>
        </button>
      </div>

      {/* The Crown Jewel: 3D Knowledge Graph */}
      <div className="absolute inset-0 z-0">
        <KnowledgeGraph3D />
      </div>

      {/* Thought Portal UI Overlay (Placeholder for actual search tunnel logic) */}
      {searchActive && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <button 
            className="absolute top-8 right-8 text-white/50 hover:text-white"
            onClick={() => setSearchActive(false)}
          >
            Close ✕
          </button>
          
          <div className="relative w-[600px] max-w-[90vw]">
            <input 
              autoFocus
              type="text" 
              placeholder="What are you looking for?"
              className="w-full bg-transparent border-b-2 border-primary/50 text-4xl text-white outline-none pb-4 font-heading font-bold text-center placeholder:text-white/20 focus:border-primary transition-colors"
            />
            {/* The "tunnel" effect would be rendered here via Three.js or complex CSS */}
            <p className="text-center text-textSecondary mt-8 font-mono">
              Press Enter to semantic search
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
