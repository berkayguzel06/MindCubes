import Link from 'next/link';

export default function Agents() {
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
          <Link href="/agents" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 text-white">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            Agents
          </Link>
          <Link href="/tasks" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Tasks
          </Link>
          <Link href="/models" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Models
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">User Name</div>
              <div className="text-xs text-gray-500 truncate">user@example.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <div className="p-8">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">My Agents</h1>
              <p className="text-gray-400 text-sm">Manage and deploy your AI agents</p>
            </div>
            <button className="px-4 py-2 bg-white text-black text-sm rounded-full font-medium hover:bg-gray-200 transition-colors">
              + Create Agent
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Agent Card 1 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">Active</div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Code Assistant</h3>
              <p className="text-sm text-gray-400 mb-4">Specialized in Python and TypeScript development with code review capabilities.</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">v1.2.0</span>
                <button className="text-sm text-white hover:underline">Manage</button>
              </div>
            </div>

            {/* Agent Card 2 */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-full border border-gray-500/20">Idle</div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Research Bot</h3>
              <p className="text-sm text-gray-400 mb-4">Web scraping and data analysis agent for market research.</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">v0.9.5</span>
                <button className="text-sm text-white hover:underline">Manage</button>
              </div>
            </div>

            {/* Create New Card */}
            <button className="glass-panel p-6 rounded-xl border border-white/5 border-dashed hover:border-white/30 transition-colors flex flex-col items-center justify-center text-center h-full min-h-[200px]">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-white font-medium">Deploy New Agent</h3>
              <p className="text-sm text-gray-500 mt-2">Start from scratch or use a template</p>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
