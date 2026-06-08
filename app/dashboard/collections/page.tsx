'use client';

import React, { useState } from 'react';
import { BookOpen, Folder, Star, Clock, Sparkles, MoreVertical, Plus, Search } from 'lucide-react';

const mockCollections = [
  { id: 1, name: 'AI Research', count: 42, color: 'from-blue-500 to-cyan-400', icon: <Sparkles size={24} className="text-white" /> },
  { id: 2, name: 'Frontend Design', count: 18, color: 'from-purple-500 to-pink-500', icon: <BookOpen size={24} className="text-white" /> },
  { id: 3, name: 'Read Later', count: 7, color: 'from-orange-400 to-red-500', icon: <Clock size={24} className="text-white" /> },
  { id: 4, name: 'Favorites', count: 24, color: 'from-yellow-400 to-orange-500', icon: <Star size={24} className="text-white" /> },
  { id: 5, name: 'Architecture Notes', count: 12, color: 'from-emerald-400 to-teal-500', icon: <Folder size={24} className="text-white" /> },
];

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto overflow-y-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">Your Collections</h1>
          <p className="text-textSecondary text-lg font-mono">Organize your cosmos of knowledge.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
            <input 
              type="text" 
              placeholder="Search collections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary/20 text-primary rounded-xl font-medium hover:bg-primary/30 transition-colors shrink-0">
            <Plus size={20} />
            <span className="hidden sm:inline">New Collection</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockCollections.map((collection) => (
          <div 
            key={collection.id} 
            className="glass-card p-6 group cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(108,71,255,0.15)]"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${collection.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {collection.icon}
              </div>
              <button className="text-textSecondary hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                <MoreVertical size={18} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{collection.name}</h3>
            <p className="text-textSecondary text-sm font-mono">{collection.count} saved items</p>
            
            <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${collection.color} opacity-50 group-hover:opacity-100 transition-opacity`} 
                style={{ width: `${Math.max(10, Math.min(100, collection.count * 2))}%` }}
              ></div>
            </div>
          </div>
        ))}
        
        {/* Create New Card */}
        <div className="glass-card p-6 border-dashed border-2 border-white/10 hover:border-primary/50 flex flex-col items-center justify-center min-h-[200px] cursor-pointer group transition-colors bg-transparent">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
            <Plus size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-medium text-textSecondary group-hover:text-white transition-colors">Create Collection</h3>
        </div>
      </div>
    </div>
  );
}
