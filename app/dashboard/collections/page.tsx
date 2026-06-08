'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Folder, Star, Clock, Sparkles, MoreVertical, Plus, Search, Loader2 } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  count: number;
  color: string;
  icon?: any;
}

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('from-primary to-secondary');
  const [isCreating, setIsCreating] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName,
          color: newCollectionColor
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCollections(prev => [{ ...data.collection, count: 0 }, ...prev]);
        setIsModalOpen(false);
        setNewCollectionName('');
      }
    } catch (error) {
      console.error('Failed to create collection', error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto overflow-y-auto pb-24 relative">
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/20 text-primary rounded-xl font-medium hover:bg-primary/30 transition-colors shrink-0"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Collection</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCollections.map((collection) => (
            <div 
              key={collection.id} 
              className="glass-card p-6 group cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(108,71,255,0.15)]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${collection.color || 'from-primary to-secondary'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Folder size={24} className="text-white" />
                </div>
                <button className="text-textSecondary hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical size={18} />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{collection.name}</h3>
              <p className="text-textSecondary text-sm font-mono">{collection.count} saved items</p>
              
              <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${collection.color || 'from-primary to-secondary'} opacity-50 group-hover:opacity-100 transition-opacity`} 
                  style={{ width: `${Math.max(10, Math.min(100, (collection.count || 0) * 5))}%` }}
                ></div>
              </div>
            </div>
          ))}
          
          {/* Create New Card */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="glass-card p-6 border-dashed border-2 border-white/10 hover:border-primary/50 flex flex-col items-center justify-center min-h-[200px] cursor-pointer group transition-colors bg-transparent"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <Plus size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-medium text-textSecondary group-hover:text-white transition-colors">Create Collection</h3>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Collection</h2>
            
            <form onSubmit={handleCreateCollection} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">Collection Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. AI Research"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">Theme Color</label>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    'from-primary to-secondary',
                    'from-blue-500 to-cyan-400',
                    'from-purple-500 to-pink-500',
                    'from-orange-400 to-red-500',
                    'from-emerald-400 to-teal-500'
                  ].map((color) => (
                    <div 
                      key={color}
                      onClick={() => setNewCollectionColor(color)}
                      className={`w-full aspect-square rounded-full bg-gradient-to-br ${color} cursor-pointer transition-transform hover:scale-110 ${newCollectionColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-surface text-textSecondary rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating || !newCollectionName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(108,71,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
