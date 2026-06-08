'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, Loader2, Link2, Folder } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Dynamically import 3D graph to avoid SSR issues
const KnowledgeGraph3D = dynamic(() => import('../../components/KnowledgeGraph3D'), { ssr: false });

interface SearchResult {
  id: string;
  title: string;
  type: 'bookmark' | 'collection';
  url?: string;
  tags?: string[];
}

export default function DashboardPage() {
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allData, setAllData] = useState<{ bookmarks: any[], collections: any[] }>({ bookmarks: [], collections: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchActive((prev) => !prev);
      }
      if (e.key === 'Escape' && searchActive) {
        setSearchActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchActive]);

  // Fetch data when modal opens
  useEffect(() => {
    if (searchActive && allData.bookmarks.length === 0) {
      const fetchData = async () => {
        try {
          const [bmRes, colRes] = await Promise.all([
            fetch('/api/bookmarks?limit=1000'),
            fetch('/api/collections')
          ]);
          
          let bookmarks = [];
          let collections = [];
          
          if (bmRes.ok) {
            const data = await bmRes.json();
            bookmarks = data.bookmarks || [];
          }
          if (colRes.ok) {
            const data = await colRes.json();
            collections = data.collections || [];
          }
          
          setAllData({ bookmarks, collections });
        } catch (err) {
          console.error("Failed to fetch search data", err);
        }
      };
      fetchData();
    }
    
    if (searchActive) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [searchActive, allData.bookmarks.length]);

  // Filter data
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const lowercaseQuery = query.toLowerCase();

    // Fast local filtering
    const matchedBookmarks = allData.bookmarks
      .filter(b => b.title?.toLowerCase().includes(lowercaseQuery) || b.url?.toLowerCase().includes(lowercaseQuery))
      .map(b => ({ id: b.id, title: b.title || b.url, type: 'bookmark' as const, url: b.url, tags: b.tags }));

    const matchedCollections = allData.collections
      .filter(c => c.name?.toLowerCase().includes(lowercaseQuery))
      .map(c => ({ id: c.id, title: c.name, type: 'collection' as const }));

    // Combine and limit to 10 results
    setResults([...matchedCollections, ...matchedBookmarks].slice(0, 10));
    setIsSearching(false);
  }, [query, allData]);

  const handleResultClick = (result: SearchResult) => {
    setSearchActive(false);
    if (result.type === 'bookmark' && result.url) {
      window.open(result.url, '_blank');
    } else if (result.type === 'collection') {
      router.push('/dashboard/collections');
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Search Trigger (Thought Portal) */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
        <button 
          onClick={() => setSearchActive(true)}
          className="flex items-center gap-3 px-6 py-3 glass-card hover:bg-textPrimary/5 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 w-96 max-w-[90vw] border border-textPrimary/10"
        >
          <Search className="text-secondary" size={20} />
          <span className="text-textSecondary font-mono text-sm">Cmd+K or click to search your mind...</span>
        </button>
      </div>

      {/* The Crown Jewel: 3D Knowledge Graph */}
      <div className="absolute inset-0 z-0">
        <KnowledgeGraph3D />
      </div>

      {/* Thought Portal UI Overlay */}
      {searchActive && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-xl flex flex-col items-center pt-32 animate-in fade-in duration-300">
          <button 
            className="absolute top-8 right-8 text-textSecondary hover:text-textPrimary"
            onClick={() => setSearchActive(false)}
          >
            Close ✕
          </button>
          
          <div className="relative w-[600px] max-w-[90vw] flex flex-col">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-primary w-8 h-8" />
              <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent border-b-2 border-primary/30 text-4xl text-textPrimary outline-none pb-4 pl-12 font-heading font-bold placeholder:text-textPrimary/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="mt-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
              {query && results.length === 0 && !isSearching && (
                <p className="text-center text-textSecondary font-mono mt-4">No results found in your mind.</p>
              )}
              
              {results.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full p-4 glass-card hover:bg-primary/10 hover:border-primary/50 cursor-pointer flex items-center gap-4 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result.type === 'collection' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                    {result.type === 'collection' ? <Folder size={20} /> : <Link2 size={20} />}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-lg font-bold text-textPrimary group-hover:text-primary transition-colors line-clamp-1">{result.title}</h4>
                    {result.type === 'bookmark' && result.url && (
                      <p className="text-sm text-textSecondary font-mono line-clamp-1 truncate">{result.url}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!query && (
               <p className="text-center text-textSecondary mt-8 font-mono">
                 Type a keyword to instantly filter bookmarks & collections
               </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
