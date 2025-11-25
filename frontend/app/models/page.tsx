'use client';

import Link from 'next/link';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarUserCard from '../components/SidebarUserCard';
import SidebarMicrosoftCard from '../components/SidebarMicrosoftCard';

export default function Models() {
  const router = useRouter();
  const { user, saveUser, hydrated } = useStoredUser();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  const handleLogout = () => {
    saveUser(null);
    router.replace('/login');
  };

  if (!hydrated || !user) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden futuristic-bg flex relative">
      {/* Sidebar (Same as Chat) */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>
            <span className="text-lg font-medium text-white">MindCubes</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 px-2">Menu</div>
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Chat
          </Link>
          <Link href="/agents" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Agents
          </Link>
          {/* <Link href="/tasks" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Tasks
          </Link> */}
          <Link href="/models" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 text-white">
            <span className="w-2 h-2 bg-pink-500 rounded-full" />
            Models
          </Link>
        </nav>

        <div className="px-4 pb-4">
          <SidebarMicrosoftCard user={user} />
        </div>
        <div className="p-4 border-t border-white/5">
          <SidebarUserCard user={user} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <div className="p-8">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">AI Models</h1>
              <p className="text-gray-400 text-sm">Configure and manage underlying models</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Model Card 1 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                  <span className="font-bold">G</span>
                </div>
                <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Connected</div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">GPT-4 Turbo</h3>
              <p className="text-sm text-gray-400 mb-4">OpenAI's latest model with 128k context window.</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">API Key Configured</span>
                <button className="text-sm text-white hover:underline">Settings</button>
              </div>
            </div>

            {/* Model Card 2 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                  <span className="font-bold">C</span>
                </div>
                <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Connected</div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Claude 3 Opus</h3>
              <p className="text-sm text-gray-400 mb-4">Anthropic's most powerful model for complex tasks.</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">API Key Configured</span>
                <button className="text-sm text-white hover:underline">Settings</button>
              </div>
            </div>

            {/* Model Card 3 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors opacity-60">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                  <span className="font-bold">L</span>
                </div>
                <div className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded-full border border-white/10">Not Configured</div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Llama 3</h3>
              <p className="text-sm text-gray-400 mb-4">Meta's open source model running locally or via API.</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">No API Key</span>
                <button className="text-sm text-white hover:underline">Connect</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
