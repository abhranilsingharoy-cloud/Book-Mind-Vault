'use client';

import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Zap, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account Profile', icon: <User size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security & Privacy', icon: <Shield size={18} /> },
    { id: 'advanced', label: 'Advanced Features', icon: <Zap size={18} /> },
  ];

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto overflow-y-auto pb-24">
      <div className="mb-10">
        <h1 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">Settings</h1>
        <p className="text-textSecondary text-lg font-mono">Manage your universe preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="glass-panel p-2 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                  activeTab === tab.id 
                    ? 'bg-primary/20 text-primary shadow-[inset_0_0_10px_rgba(108,71,255,0.2)]' 
                    : 'text-textSecondary hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1">
          <div className="glass-panel p-8 min-h-[500px]">
            {activeTab === 'account' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Account Profile</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-1">
                      <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                        <User size={40} className="text-textSecondary" />
                      </div>
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-medium hover:bg-primary/30 transition-colors mb-2">Change Avatar</button>
                      <p className="text-sm text-textSecondary">JPG, GIF or PNG. Max size of 800K</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-textSecondary font-medium">Display Name</label>
                      <input type="text" className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" defaultValue="Space Explorer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-textSecondary font-medium">Email Address</label>
                      <input type="email" className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" defaultValue="explorer@mindvault.space" readOnly />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="text-sm text-textSecondary font-medium">Bio</label>
                    <textarea className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px]" defaultValue="Curating the infinite universe of knowledge." />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Appearance</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border-2 border-primary bg-background rounded-xl p-4 cursor-pointer relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-full h-24 bg-surface rounded-lg mb-3 flex items-center justify-center border border-white/5">
                          <div className="w-12 h-12 rounded-full bg-background border border-white/10"></div>
                        </div>
                        <p className="text-center font-medium">Deep Space</p>
                      </div>
                      <div className="border border-white/10 bg-white rounded-xl p-4 cursor-pointer opacity-50 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl z-10">
                          <span className="bg-black/80 text-xs px-2 py-1 rounded text-white">Coming Soon</span>
                        </div>
                        <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white shadow-sm"></div>
                        </div>
                        <p className="text-center font-medium text-gray-800">Light Matter</p>
                      </div>
                      <div className="border border-white/10 bg-[#0A192F] rounded-xl p-4 cursor-pointer opacity-50 relative overflow-hidden">
                         <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl z-10">
                          <span className="bg-black/80 text-xs px-2 py-1 rounded text-white">Coming Soon</span>
                        </div>
                        <div className="w-full h-24 bg-[#112240] rounded-lg mb-3 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#0A192F] shadow-sm"></div>
                        </div>
                        <p className="text-center font-medium text-blue-100">Nebula</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Animation Intensity</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-textSecondary text-sm">Minimal</span>
                      <input type="range" min="1" max="100" defaultValue="75" className="flex-1 accent-primary" />
                      <span className="text-textSecondary text-sm">Immersive</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {['notifications', 'security', 'advanced'].includes(activeTab) && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-[0_0_30px_rgba(108,71,255,0.1)]">
                  <Shield size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Module Offline</h2>
                <p className="text-textSecondary max-w-md">
                  This configuration sector is currently being upgraded by our orbital engineers. Check back soon.
                </p>
              </div>
            )}

          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(108,71,255,0.4)] transition-all transform hover:-translate-y-1">
              <Save size={18} />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
