'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { StoredUserSession } from '@/hooks/useStoredUser';
import SidebarMicrosoftCard from './SidebarMicrosoftCard';
import SidebarUserCard from './SidebarUserCard';

type SidebarProps = {
  user: StoredUserSession;
  onLogout: () => void;
};

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const isChat = pathname.startsWith('/chat');
  const isAgents = pathname.startsWith('/agents');
  const isModels = pathname.startsWith('/models');

  const baseLinkClasses =
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors';
  const inactiveClasses =
    'text-gray-400 hover:text-white hover:bg-white/5';
  const activeClasses = 'bg-white/10 text-white';

  return (
    <aside className="w-64 glass-panel border-r border-white/5 flex flex-col z-20">
      {/* Logo + Brand */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="MindCubes Logo"
            className="w-8 h-8 rounded-xl object-contain shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
          <span className="text-lg font-medium text-white">MindCubes</span>
        </Link>
      </div>

      {/* Main menu */}
      <nav className="flex-1 px-4 space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 px-2">
          Menu
        </div>

        <Link
          href="/agents"
          className={`${baseLinkClasses} ${
            isAgents ? activeClasses : inactiveClasses
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isAgents ? 'bg-purple-500' : 'bg-gray-600'
            }`}
          />
          Agents
        </Link>

        <Link
          href="/models"
          className={`${baseLinkClasses} ${
            isModels ? activeClasses : inactiveClasses
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isModels ? 'bg-emerald-500' : 'bg-gray-600'
            }`}
          />
          Models
        </Link>

        <Link
          href="/chat"
          className={`${baseLinkClasses} mt-4 ${
            isChat ? activeClasses : inactiveClasses
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isChat ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          />
          Chat
        </Link>
      </nav>

      {/* Microsoft card */}
      <div className="px-4 pb-4">
        <SidebarMicrosoftCard user={user} />
      </div>

      {/* User card */}
      <div className="p-4 border-t border-white/5 mt-auto">
        <SidebarUserCard user={user} onLogout={onLogout} />
      </div>
    </aside>
  );
}


