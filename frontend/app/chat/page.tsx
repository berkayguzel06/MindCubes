"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useStoredUser } from '@/hooks/useStoredUser';
import Sidebar from '../components/Sidebar';

interface Message {
  role: string;
  content: string;
  thinking?: string;  // CoT thinking content
  file?: {
    name: string;
    type: string;
  };
  metadata?: {
    workflow_triggered?: boolean;
    agent?: string;
    pending_action?: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
}

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Extract thinking content from CoT model response
const extractThinking = (content: string): { thinking: string | null; response: string } => {
  // Common CoT patterns: <think>...</think>, <thinking>...</thinking>, [thinking]...[/thinking]
  const thinkPatterns = [
    /<think>([\s\S]*?)<\/think>/i,
    /<thinking>([\s\S]*?)<\/thinking>/i,
    /\[thinking\]([\s\S]*?)\[\/thinking\]/i,
    /\[think\]([\s\S]*?)\[\/think\]/i,
    /^(Düşünüyorum:[\s\S]*?)(?=\n\n|$)/m,
    /^(Let me think[\s\S]*?)(?=\n\n|$)/im,
  ];
  
  for (const pattern of thinkPatterns) {
    const match = content.match(pattern);
    if (match) {
      const thinking = match[1].trim();
      const response = content.replace(match[0], '').trim();
      return { thinking, response };
    }
  }
  
  return { thinking: null, response: content };
};

// Simple markdown parser for common patterns
const parseMarkdown = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    let processedLine: React.ReactNode = line;
    
    // Process bold text **text**
    if (line.includes('**')) {
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      processedLine = parts.map((part, i) => 
        i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
      );
    }
    
    // Process italic text *text* (but not **)
    if (typeof processedLine === 'string' && processedLine.includes('*') && !processedLine.includes('**')) {
      const parts = processedLine.split(/\*([^*]+)\*/g);
      processedLine = parts.map((part, i) => 
        i % 2 === 1 ? <em key={i} className="italic">{part}</em> : part
      );
    }
    
    // Bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      if (!line.includes('**')) {
        elements.push(
          <div key={lineIndex} className="ml-4 my-1 flex items-start gap-2">
            <span className="text-indigo-400">•</span>
            <span>{typeof processedLine === 'string' ? processedLine.replace(/^[\s•\-\*]+/, '') : processedLine}</span>
          </div>
        );
        return;
      }
    }
    
    // Success indicator
    if (line.startsWith('✅')) {
      elements.push(
        <div key={lineIndex} className="text-green-500 font-medium my-1">
          {processedLine}
        </div>
      );
      return;
    }
    
    // Error indicator
    if (line.startsWith('❌')) {
      elements.push(
        <div key={lineIndex} className="text-red-500 font-medium my-1">
          {processedLine}
        </div>
      );
      return;
    }
    
    // Warning indicator
    if (line.startsWith('⚠️')) {
      elements.push(
        <div key={lineIndex} className="text-yellow-500 font-medium my-1">
          {processedLine}
        </div>
      );
      return;
    }
    
    // Regular line or empty line
    if (line.trim()) {
      elements.push(<div key={lineIndex} className="my-1">{processedLine}</div>);
    } else {
      elements.push(<br key={lineIndex} />);
    }
  });
  
  return elements;
};

export default function Chat() {
  const router = useRouter();
  const { user, saveUser, hydrated } = useStoredUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState<string>('');
  const [showThinking, setShowThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 200;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Load chat sessions from localStorage
  const loadChatSessions = useCallback(() => {
    const stored = localStorage.getItem('chat_sessions');
    if (stored) {
      try {
        setChatSessions(JSON.parse(stored));
      } catch {
        setChatSessions([]);
      }
    }
  }, []);

  // Save current session to history
  const saveCurrentSession = useCallback((msgs: Message[], sid: string) => {
    if (msgs.length === 0) return;
    
    const firstUserMsg = msgs.find(m => m.role === 'user');
    const title = firstUserMsg?.content.slice(0, 50) || 'Yeni sohbet';
    
    const stored = localStorage.getItem('chat_sessions');
    let sessions: ChatSession[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = sessions.findIndex(s => s.id === sid);
    const sessionData: ChatSession = {
      id: sid,
      title: title + (title.length >= 50 ? '...' : ''),
      lastMessage: msgs[msgs.length - 1]?.content.slice(0, 100) || '',
      createdAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionData;
    } else {
      sessions.unshift(sessionData);
    }
    
    sessions = sessions.slice(0, 20);
    
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    setChatSessions(sessions);
  }, []);

  // Load session messages from localStorage
  const loadSessionMessages = useCallback((sid: string) => {
    const stored = localStorage.getItem(`chat_messages_${sid}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  // Save messages to localStorage
  const saveSessionMessages = useCallback((msgs: Message[], sid: string) => {
    localStorage.setItem(`chat_messages_${sid}`, JSON.stringify(msgs));
  }, []);

  // Initialize session on mount
  useEffect(() => {
    loadChatSessions();
    
    const storedSessionId = sessionStorage.getItem('chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      const loadedMessages = loadSessionMessages(storedSessionId);
      setMessages(loadedMessages);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      sessionStorage.setItem('chat_session_id', newSessionId);
    }
  }, [loadChatSessions, loadSessionMessages]);

  // Save messages when they change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveSessionMessages(messages, sessionId);
      saveCurrentSession(messages, sessionId);
    }
  }, [messages, sessionId, saveSessionMessages, saveCurrentSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start new chat session
  const handleNewChat = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    sessionStorage.setItem('chat_session_id', newSessionId);
    setMessages([]);
    setInput('');
    removeSelectedFile();
  };

  // Load a previous session
  const handleLoadSession = (sid: string) => {
    setSessionId(sid);
    sessionStorage.setItem('chat_session_id', sid);
    const loadedMessages = loadSessionMessages(sid);
    setMessages(loadedMessages);
    setShowHistory(false);
  };

  // Delete a session
  const handleDeleteSession = (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sessions = chatSessions.filter(s => s.id !== sid);
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    localStorage.removeItem(`chat_messages_${sid}`);
    setChatSessions(sessions);
    
    if (sid === sessionId) {
      handleNewChat();
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    
    const userMsg: Message = { 
      role: 'user', 
      content: input,
      file: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type
      } : undefined
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setThinkingText('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    try {
      const historyForContext = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('message', userMsg.content);
        formData.append('userId', user?.id ?? 'anonymous');
        formData.append('provider', 'ollama');
        formData.append('file', selectedFile);
        
        const response = await fetch('http://localhost:8000/api/chat/workflow', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data && data.response) {
          const { thinking, response: cleanResponse } = extractThinking(data.response);
          setMessages((prev) => [...prev, { 
            role: 'assistant', 
            content: cleanResponse,
            thinking: thinking || undefined,
            metadata: data.metadata
          }]);
        } else if (data && data.success === false) {
          setMessages((prev) => [...prev, { 
            role: 'assistant', 
            content: `❌ Hata: ${data.detail || 'Bilinmeyen hata'}`
          }]);
        }
        
        removeSelectedFile();
      } else {
        // Show thinking animation
        setThinkingText('Düşünüyor');
        
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg.content,
            history: historyForContext,
            userId: user?.id ?? 'anonymous',
            sessionId: sessionId,
            use_master_agent: true
          }),
        });
        
        const data = await response.json();
        
        if (data && data.response) {
          const { thinking, response: cleanResponse } = extractThinking(data.response);
          setMessages((prev) => [...prev, { 
            role: 'assistant', 
            content: cleanResponse,
            thinking: thinking || undefined,
            metadata: data.metadata
          }]);
        }
      }
    } catch (e) {
      console.error('Chat error', e);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: '❌ Sunucuya bağlanırken hata oluştu. Lütfen AI Engine\'in çalıştığından emin olun.'
      }]);
    } finally {
      setIsLoading(false);
      setThinkingText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter allows new line (default behavior)
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
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Chat History Panel */}
      <div className={`${showHistory ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/5 glass-panel flex flex-col z-20`}>
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-medium">Sohbet Geçmişi</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chatSessions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Henüz sohbet yok</p>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleLoadSession(session.id)}
                className={`p-3 rounded-lg cursor-pointer mb-2 group ${
                  session.id === sessionId 
                    ? 'bg-indigo-500/20 border border-indigo-500/30' 
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{session.title}</p>
                    <p className="text-gray-400 text-xs mt-1 truncate">{session.lastMessage}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 glass-panel">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Sohbet Geçmişi"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <h1 className="text-white font-medium">MindCubes AI</h1>
            <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
              Asistan
            </span>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Sohbet
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-white mb-2">Merhaba!</h2>
              <p className="text-gray-400 max-w-md mb-6">
                Ben MindCubes AI asistanınım. Size görev oluşturma, takvim yönetimi, 
                dosya kaydetme ve daha fazlasında yardımcı olabilirim.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <button 
                  onClick={() => setInput('Bu dosyadan görevleri çıkar')}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-indigo-400 font-medium mb-1">📋 Görev Oluştur</div>
                  <div className="text-gray-400">&quot;Bu PDF&apos;den görev çıkar&quot;</div>
                </button>
                <button 
                  onClick={() => setInput('Yarın saat 14:00\'da toplantı ekle')}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-indigo-400 font-medium mb-1">📅 Takvime Ekle</div>
                  <div className="text-gray-400">&quot;Yarın 14:00&apos;da toplantı&quot;</div>
                </button>
                <button 
                  onClick={() => setInput('Bu dosyayı buluta kaydet')}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-indigo-400 font-medium mb-1">☁️ Dosya Kaydet</div>
                  <div className="text-gray-400">&quot;Dosyayı Drive&apos;a kaydet&quot;</div>
                </button>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl w-fit ${msg.role === 'user' ? '' : 'space-y-2'}`}>
                {/* Thinking bubble for assistant messages */}
                {msg.role === 'assistant' && msg.thinking && (
                  <div className="mb-2">
                    <button
                      onClick={() => setShowThinking(!showThinking)}
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors mb-1"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showThinking ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Düşünme süreci
                      </span>
                    </button>
                    {showThinking && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-sm text-yellow-200/80 italic">
                        {msg.thinking}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Main message bubble */}
                <div
                  className={`rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
                      : 'bg-white/90 text-gray-900 rounded-bl-sm border border-white/40'
                  }`}
                >
                  {/* File attachment indicator */}
                  {msg.file && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-xs opacity-80">{msg.file.name}</span>
                    </div>
                  )}
                  
                  {/* Message content with markdown parsing */}
                  <div className="whitespace-pre-wrap">{parseMarkdown(msg.content)}</div>
                  
                  {/* Workflow indicator */}
                  {msg.metadata?.workflow_triggered && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Otomasyon çalıştı
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator with thinking */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/90 text-gray-900 rounded-2xl rounded-bl-sm px-5 py-4 border border-white/40">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-sm text-gray-600">{thinkingText || 'Düşünüyor'}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 glass-panel">
          {/* Selected File Preview */}
          {selectedFile && (
            <div className="max-w-4xl mx-auto mb-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-white flex-1 truncate">{selectedFile.name}</span>
                <span className="text-gray-400 text-xs">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
                <button 
                  onClick={removeSelectedFile}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto relative flex items-end gap-2">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.txt,.doc,.docx,.csv,.json,.md"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              title="Dosya Ekle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            {/* Textarea Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors resize-none overflow-hidden"
                placeholder={selectedFile ? "Dosya hakkında ne yapmak istersiniz?" : "Bir şeyler yazın... (Shift+Enter ile alt satır)"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={1}
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />
            </div>
            
            {/* Send Button */}
            <button
              className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
                isLoading || (!input.trim() && !selectedFile)
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !selectedFile)}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Hint text */}
          <div className="max-w-4xl mx-auto mt-2 text-xs text-gray-500">
            Enter ile gönder • Shift+Enter ile alt satıra geç
          </div>
          
          {/* Quick Actions */}
          <div className="max-w-4xl mx-auto mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInput('Bu dosyadan görevleri çıkar')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              📋 Görev Çıkar
            </button>
            <button
              onClick={() => setInput('Takvime etkinlik ekle')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              📅 Takvime Ekle
            </button>
            <button
              onClick={() => setInput('Bu dosyayı buluta kaydet')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              ☁️ Buluta Kaydet
            </button>
            <button
              onClick={() => setInput('E-postalarımı önceliklendir')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              📧 E-posta Önceliklendir
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
