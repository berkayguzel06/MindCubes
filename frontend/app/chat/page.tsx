"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const MICROSOFT_AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_AUTH_PARAMS = {
  client_id: '22c7a263-dc1c-4b96-8e72-d86990737b9b',
  response_type: 'code',
  redirect_uri: 'http://localhost:5678/webhook/oauth2/callback',
  response_mode: 'query',
  scope: 'offline_access https://graph.microsoft.com/.default',
};
const USER_EMAIL_KEY = 'mindcubes:userEmail';

export default function Chat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: 'How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState(''); // empty means default
  const [model, setModel] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          provider: provider || undefined,
          model: model || undefined,
          userId: 'default',
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
    if (typeof window === 'undefined') return;
    const storedEmail = window.localStorage.getItem(USER_EMAIL_KEY);
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  const microsoftAuthUrl = useMemo(() => {
    if (!userEmail) return '';
    const params = new URLSearchParams({
      ...MICROSOFT_AUTH_PARAMS,
      state: userEmail,
    });
    return `${MICROSOFT_AUTH_BASE}?${params.toString()}`;
  }, [userEmail]);

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
          <Link href="/tasks" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Tasks
          </Link>
          <Link href="/models" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Models
          </Link>
        </nav>

        <div className="px-4 pb-4">
          <div className="border border-white/10 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">Microsoft Auth</p>
              <p className="text-xs text-gray-400">
                {userEmail ? `State parametresi için ${userEmail}` : 'Email adresini giriş ekranından kaydet.'}
              </p>
            </div>
            {userEmail ? (
              <a
                href={microsoftAuthUrl}
                className="block text-center bg-indigo-500/90 hover:bg-indigo-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Yetkilendirmeyi Aç
              </a>
            ) : (
              <div className="text-xs text-gray-500 bg-white/5 rounded-lg px-3 py-2">
                Microsoft bağlantısı için önce login sayfasından e-posta gir.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">User Name</div>
              <div className="text-xs text-gray-500 truncate">user@example.com</div>
            </div>
          </div>
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
              className="bg-white/10 text-white rounded px-2 py-1"
            >
              <option value="">Default Provider</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="local">Local</option>
            </select>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-white/10 text-white rounded px-2 py-1"
            >
              <option value="">Default Model</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
              <option value="TinyLlama/TinyLlama-1.1B-Chat-v1.0">TinyLlama</option>
              <option value="phi-2">Microsoft Phi-2</option>
              <option value="codellama/CodeLlama-7b-Instruct-hf">CodeLlama 7B</option>
            </select>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={msg.role === 'user' ? 'self-end' : 'self-start'}>
              <div className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white'}`}>
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
