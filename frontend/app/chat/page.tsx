"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStoredUser } from '@/hooks/useStoredUser';
import SidebarUserCard from '../components/SidebarUserCard';
import SidebarMicrosoftCard from '../components/SidebarMicrosoftCard';

export default function Chat() {
  const router = useRouter();
  const { user, saveUser, hydrated } = useStoredUser();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
  ]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState('ollama');
  const MODEL_PRESETS = [
    {
      key: 'gptoss20b',
      label: 'GPT-OSS 20B',
      values: {
        local: 'openai/gpt-oss-20b',
        ollama: 'gpt-oss:20b',
        default: 'openai/gpt-oss-20b',
      },
    },
  ] as const;
  const [modelKey, setModelKey] = useState<(typeof MODEL_PRESETS)[number]['key']>('gptoss20b');

  const resolveModel = () => {
    const preset = MODEL_PRESETS.find((item) => item.key === modelKey);
    if (!preset) return '';
    return preset.values[provider as keyof typeof preset.values] ?? preset.values.default ?? '';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      const resolvedModel = resolveModel();
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          provider: provider || undefined,
          model: resolvedModel || undefined,
          userId: user?.id ?? 'anonymous',
          metadata: {
            directModel: true,
            provider,
            model: resolvedModel,
            systemPrompt:
              'You are a friendly assistant for the MindCubes application. Respond conversationally in the same language as the user and only provide code or technical details when explicitly requested.',
          },
        }),
      });
      const data = await response.json();
      if (data && data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (e) {
      console.error('Chat error', e);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error contacting server.' }]);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
      return;
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
      {/* Sidebar */}
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
          <Link href="/chat" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 text-white">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
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
          <Link href="/models" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Models
          </Link>
        </nav>

        <div className="px-4 pb-4">
          <SidebarMicrosoftCard user={user} />
        </div>

        <div className="p-4 border-t border-white/5 mt-auto">
          <SidebarUserCard user={user} onLogout={handleLogout} />
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 glass-panel">
          <h1 className="text-white font-medium">New Chat</h1>
          <div className="flex gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="bg-white/80 text-gray-900 rounded px-3 py-1 text-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            >
              <option value="local">Local</option>
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
            <select
              value={modelKey}
              onChange={(e) => setModelKey(e.target.value as (typeof MODEL_PRESETS)[number]['key'])}
              className="bg-white/80 text-gray-900 rounded px-3 py-1 text-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            >
              {MODEL_PRESETS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl w-fit rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
                    : 'bg-white/80 text-gray-900 rounded-bl-sm border border-white/40'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 glass-panel">
          <div className="max-w-4xl mx-auto relative">
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
              onClick={handleSend}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
