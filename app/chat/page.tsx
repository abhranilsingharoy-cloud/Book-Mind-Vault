import React from 'react';
import ChatInterface from '../../components/ChatInterface';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen w-screen bg-background text-textPrimary p-4 md:p-8">
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-textSecondary hover:text-primary transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Galaxy</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-hidden relative max-w-5xl mx-auto w-full">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        <div className="relative z-10 h-full">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
