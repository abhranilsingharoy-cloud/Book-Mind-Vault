import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, BookmarkPlus } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:3000/api/bookmarks';

function App() {
  const [tabInfo, setTabInfo] = useState<{ url: string; title: string }>({ url: '', title: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recentSaves, setRecentSaves] = useState<any[]>([]);

  useEffect(() => {
    // Get current tab
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          setTabInfo({ url: tabs[0].url || '', title: tabs[0].title || '' });
        }
      });
    }

    // Fetch recent saves
    fetchRecentSaves();
  }, []);

  const fetchRecentSaves = async () => {
    try {
      const { token } = await chrome.storage.local.get('token');
      const res = await fetch(`${API_URL}?limit=5`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentSaves(data.bookmarks || []);
      }
    } catch (e) {
      console.error('Failed to fetch recents', e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { token } = await chrome.storage.local.get('token');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(tabInfo)
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => window.close(), 1500);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-[360px] bg-[#050510] text-[#F0F0FF] p-4 font-sans border-b-2 border-primary/20">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C47FF] to-[#00D4FF] flex items-center justify-center">
          <BookmarkPlus size={18} className="text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-wide">Book Mind Vault</h1>
      </div>

      <div className="mb-6">
        <label className="block text-xs text-[#8B8FA8] mb-1 uppercase tracking-wider font-semibold">Title</label>
        <input 
          type="text" 
          value={tabInfo.title}
          onChange={e => setTabInfo({ ...tabInfo, title: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-[#6C47FF] transition-colors"
        />
        
        <button 
          onClick={handleSave}
          disabled={saving || saved}
          className="mt-4 w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden"
          style={{
            backgroundColor: saved ? '#10B981' : '#6C47FF',
          }}
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 size={18} /> Saved!</>
          ) : (
            'Save to Universe'
          )}
        </button>
      </div>

      <div>
        <h3 className="text-xs text-[#8B8FA8] mb-3 uppercase tracking-wider font-semibold">Recent Saves</h3>
        <div className="space-y-2">
          {recentSaves.length === 0 ? (
            <p className="text-sm text-center text-white/40 py-4">No recent saves</p>
          ) : (
            recentSaves.map(bookmark => (
              <div key={bookmark.id} className="p-2 bg-white/5 rounded-md flex items-start gap-3">
                {bookmark.favicon_url ? (
                  <img src={bookmark.favicon_url} alt="" className="w-4 h-4 mt-1 rounded-sm" />
                ) : (
                  <div className="w-4 h-4 mt-1 bg-white/20 rounded-sm"></div>
                )}
                <div>
                  <div className="text-xs font-medium line-clamp-1">{bookmark.title}</div>
                  <div className="text-[10px] text-[#8B8FA8] line-clamp-1 mt-0.5">{bookmark.summary || 'Processing...'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
