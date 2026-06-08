'use client';

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Save, Check, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  
  // Theme handling
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Notifications Form State
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
    marketing: false,
  });

  // Security Form State
  const [security, setSecurity] = useState({
    '2fa': false,
    sessionTimeout: '30',
  });

  const tabs = [
    { id: 'account', label: 'Account Profile', icon: <User size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security & Privacy', icon: <Shield size={18} /> },
  ];

  const handleToggle = (settingGroup: any, key: string, setFunc: any) => {
    setFunc({ ...settingGroup, [key]: !settingGroup[key] });
  };

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
                    ? 'bg-primary/20 text-primary shadow-[inset_0_0_10px_rgba(var(--primary),0.2)]' 
                    : 'text-textSecondary hover:bg-textPrimary/5 hover:text-textPrimary'
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
            
            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-textPrimary border-b border-textPrimary/10 pb-4">Account Profile</h2>
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
                      <input type="text" className="w-full bg-surface border border-textPrimary/10 rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" defaultValue="Space Explorer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-textSecondary font-medium">Email Address</label>
                      <input type="email" className="w-full bg-surface border border-textPrimary/10 rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" defaultValue="explorer@mindvault.space" readOnly />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="text-sm text-textSecondary font-medium">Bio</label>
                    <textarea className="w-full bg-surface border border-textPrimary/10 rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px]" defaultValue="Curating the infinite universe of knowledge." />
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-textPrimary border-b border-textPrimary/10 pb-4">Appearance</h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    {mounted ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Deep Space Theme */}
                        <div 
                          onClick={() => setTheme('deep-space')}
                          className={`border-2 ${theme === 'deep-space' ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'border-textPrimary/10'} bg-[#050510] rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all`}
                        >
                          <div className="w-full h-24 bg-[#0F1117] rounded-lg mb-3 flex items-center justify-center border border-white/5">
                            <div className="w-12 h-12 rounded-full bg-[#050510] border border-white/10"></div>
                          </div>
                          <p className="text-center font-medium text-[#F0F0FF]">Deep Space</p>
                          {theme === 'deep-space' && <Check size={16} className="absolute top-2 right-2 text-[#6C47FF]" />}
                        </div>

                        {/* Light Matter Theme */}
                        <div 
                          onClick={() => setTheme('light-matter')}
                          className={`border-2 ${theme === 'light-matter' ? 'border-[#5E35B1] shadow-[0_0_15px_rgba(94,53,177,0.3)]' : 'border-gray-200'} bg-[#F8F9FA] rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all`}
                        >
                          <div className="w-full h-24 bg-[#FFFFFF] rounded-lg mb-3 flex items-center justify-center border border-gray-100">
                            <div className="w-12 h-12 rounded-full bg-[#F8F9FA] shadow-sm border border-gray-200"></div>
                          </div>
                          <p className="text-center font-medium text-[#1A1A24]">Light Matter</p>
                          {theme === 'light-matter' && <Check size={16} className="absolute top-2 right-2 text-[#5E35B1]" />}
                        </div>

                        {/* Nebula Theme */}
                        <div 
                          onClick={() => setTheme('nebula')}
                          className={`border-2 ${theme === 'nebula' ? 'border-[#64FFDA] shadow-[0_0_15px_rgba(100,255,218,0.3)]' : 'border-white/10'} bg-[#0A192F] rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all`}
                        >
                          <div className="w-full h-24 bg-[#112240] rounded-lg mb-3 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#0A192F] shadow-sm"></div>
                          </div>
                          <p className="text-center font-medium text-[#E6F1FF]">Nebula</p>
                          {theme === 'nebula' && <Check size={16} className="absolute top-2 right-2 text-[#64FFDA]" />}
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    )}
                  </div>
                  
                  <div className="space-y-4 mt-8">
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

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-textPrimary border-b border-textPrimary/10 pb-4">Notifications</h2>
                
                <div className="space-y-6">
                  {[
                    { key: 'email', title: 'Email Notifications', desc: 'Receive daily digests of your vault activity.' },
                    { key: 'push', title: 'Push Notifications', desc: 'Get instant alerts for AI insights and processing completion.' },
                    { key: 'updates', title: 'Product Updates', desc: 'Hear about new features and updates.' },
                    { key: 'marketing', title: 'Marketing Emails', desc: 'Receive occasional offers and promotional content.' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-textPrimary/5 hover:border-textPrimary/10 transition-colors">
                      <div>
                        <h3 className="font-medium text-textPrimary">{item.title}</h3>
                        <p className="text-sm text-textSecondary">{item.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleToggle(notifications, item.key, setNotifications)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-textPrimary border-b border-textPrimary/10 pb-4">Security & Privacy</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-textPrimary/5">
                    <div>
                      <h3 className="font-medium text-textPrimary">Two-Factor Authentication</h3>
                      <p className="text-sm text-textSecondary">Add an extra layer of security to your account.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle(security, '2fa', setSecurity)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${security['2fa'] ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${security['2fa'] ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-surface border border-textPrimary/5 space-y-4">
                    <div>
                      <h3 className="font-medium text-textPrimary">Auto-Logout Session</h3>
                      <p className="text-sm text-textSecondary">Automatically log out after a period of inactivity.</p>
                    </div>
                    <select 
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})}
                      className="bg-background border border-textPrimary/10 rounded-lg px-4 py-2 text-textPrimary focus:outline-none focus:border-primary w-full max-w-xs"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="never">Never</option>
                    </select>
                  </div>

                  <div className="pt-4 mt-8 border-t border-textPrimary/10">
                    <h3 className="text-red-500 font-medium mb-2">Danger Zone</h3>
                    <p className="text-sm text-textSecondary mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-medium hover:bg-red-500/20 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all transform hover:-translate-y-1">
              <Save size={18} />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
