import React from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Compass, BookOpen, MessageSquare, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-textPrimary">
      {/* Spatial Sidebar */}
      <aside className="w-20 md:w-64 h-full glass-panel border-y-0 border-l-0 rounded-none z-20 flex flex-col justify-between py-6 relative" style={{ transform: 'translateZ(20px)' }}>
        <div>
          <div className="px-6 mb-10 hidden md:block">
            <h2 className="font-heading font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Book Mind Vault</h2>
          </div>
          
          <nav className="flex flex-col gap-4 px-4">
            <NavItem href="/dashboard" icon={<Compass size={24} />} label="Galaxy View" active />
            <NavItem href="/dashboard/collections" icon={<BookOpen size={24} />} label="Collections" />
            <NavItem href="/chat" icon={<MessageSquare size={24} />} label="Ask AI" />
          </nav>
        </div>

        <div className="px-4 flex flex-col gap-4">
          <NavItem href="/settings" icon={<Settings size={24} />} label="Settings" />
          <div className="flex items-center justify-center md:justify-start px-2 mt-4">
            <UserButton afterSignOutUrl="/" />
            <span className="ml-3 hidden md:inline text-sm font-medium text-textSecondary">Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${active ? 'bg-primary/20 text-primary shadow-[inset_0_0_10px_rgba(108,71,255,0.2)]' : 'hover:bg-white/5 text-textSecondary hover:text-white'}`}>
        {icon}
        <span className="hidden md:block font-medium">{label}</span>
      </div>
    </Link>
  );
}
