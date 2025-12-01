"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useStoredUser } from '@/hooks/useStoredUser';
import Sidebar from '../components/Sidebar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface Message {
  id?: string;
  role: string;
  content: string;
  thinking?: string;
  file?: {
    name: string;
    type: string;
  };
  metadata?: {
    workflow_triggered?: boolean;
    agent?: string;
    pending_action?: string;
  };
  created_at?: string;
}

interface ChatSession {
  session_id: string;
  last_message: string;
  created_at: string;
  title?: string;
}

interface OllamaModel {
  id: string;
  name: string;
  parameterSize: string;
  family: string;
}

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Extract thinking content from CoT model response
const extractThinking = (content: string): { thinking: string | null; response: string } => {
  const thinkPatterns = [
    /<think>([\s\S]*?)<\/think>/i,
    /<thinking>([\s\S]*?)<\/thinking>/i,
    /\[thinking\]([\s\S]*?)\[\/thinking\]/i,
    /\[think\]([\s\S]*?)\[\/think\]/i,
    /^(Let me think[\s\S]*?)(?=\n\n|$)/im,
    /^(Thinking:[\s\S]*?)(?=\n\n|$)/m,
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
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
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

  // Load available Ollama models
  const loadOllamaModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/models/ollama`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setAvailableModels(data.data);
        // Set default model if not already set
        if (!selectedModel && data.data.length > 0) {
          // Prefer gpt-oss model if available, otherwise use first model
          const defaultModel = data.data.find((m: OllamaModel) => m.name.includes('gpt-oss')) || data.data[0];
          setSelectedModel(defaultModel.name);
        }
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  // Load chat sessions from database
  const loadChatSessions = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat/sessions?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Add title from last_message
        const sessionsWithTitles = data.data.map((s: ChatSession) => ({
          ...s,
          title: s.last_message?.slice(0, 50) + (s.last_message?.length > 50 ? '...' : '') || 'New chat'
        }));
        setChatSessions(sessionsWithTitles);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user?.id]);

  // Load session messages from database
  const loadSessionMessages = useCallback(async (sid: string) => {
    if (!user?.id) return [];
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat/history?userId=${user.id}&sessionId=${sid}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata,
          created_at: msg.created_at
        }));
      }
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
    return [];
  }, [user?.id]);

  // Load models on mount
  useEffect(() => {
    loadOllamaModels();
  }, [loadOllamaModels]);

  // Initialize session on mount
  useEffect(() => {
    if (!user?.id) return;
    
    loadChatSessions();
    
    // Check for existing session in sessionStorage
    const storedSessionId = sessionStorage.getItem('chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadSessionMessages(storedSessionId).then(msgs => {
        if (msgs.length > 0) {
          setMessages(msgs);
        }
      });
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      sessionStorage.setItem('chat_session_id', newSessionId);
    }
  }, [user?.id, loadChatSessions, loadSessionMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
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
  const handleNewChat = async () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    sessionStorage.setItem('chat_session_id', newSessionId);
    setMessages([]);
    setInput('');
    removeSelectedFile();
  };

  // Load a previous session
  const handleLoadSession = async (sid: string) => {
    setSessionId(sid);
    sessionStorage.setItem('chat_session_id', sid);
    
    const loadedMessages = await loadSessionMessages(sid);
    setMessages(loadedMessages);
    setShowHistory(false);
  };

  // Delete a session
  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.id) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/v1/chat/history`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: sid })
      });
      
      // Update local state
      setChatSessions(prev => prev.filter(s => s.session_id !== sid));
      
      if (sid === sessionId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
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
      if (selectedFile) {
        // File upload - use AI Engine directly
        const formData = new FormData();
        formData.append('message', userMsg.content);
        formData.append('userId', user?.id ?? 'anonymous');
        formData.append('provider', 'ollama');
        formData.append('file', selectedFile);
        if (selectedModel) {
          formData.append('model', selectedModel);
        }
        
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
            content: `❌ Error: ${data.detail || 'Unknown error'}`
          }]);
        }
        
        removeSelectedFile();
      } else {
        // Text message - use backend API (which saves to database)
        setThinkingText('Thinking');
        
        const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg.content,
            userId: user?.id ?? 'anonymous',
            sessionId: sessionId,
            model: selectedModel || undefined
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
          
          // Update session ID if returned from backend
          if (data.sessionId && data.sessionId !== sessionId) {
            setSessionId(data.sessionId);
            sessionStorage.setItem('chat_session_id', data.sessionId);
          }
          
          // Refresh sessions list
          loadChatSessions();
        } else if (data && data.success === false) {
          setMessages((prev) => [...prev, { 
            role: 'assistant', 
            content: `❌ Error: ${data.message || 'Unknown error'}`
          }]);
        }
      }
    } catch (e) {
      console.error('Chat error', e);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: '❌ Failed to connect to server. Please make sure the backend and AI Engine are running.'
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
          <h2 className="text-white font-medium">Chat History</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : chatSessions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No chats yet</p>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => handleLoadSession(session.session_id)}
                className={`p-3 rounded-lg cursor-pointer mb-2 group ${
                  session.session_id === sessionId 
                    ? 'bg-indigo-500/20 border border-indigo-500/30' 
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{session.title}</p>
                    <p className="text-gray-400 text-xs mt-1 truncate">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
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
              title="Chat History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <h1 className="text-white font-medium">MindCubes AI</h1>
            
            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoadingModels || availableModels.length === 0}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingModels ? (
                  <option>Loading...</option>
                ) : availableModels.length === 0 ? (
                  <option>No models</option>
                ) : (
                  availableModels.map((model) => (
                    <option key={model.id} value={model.name} className="bg-gray-900">
                      {model.name} ({model.parameterSize})
                    </option>
                  ))
                )}
              </select>
              <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-white mb-2">Hello!</h2>
              <p className="text-gray-400 max-w-md mb-6">
                I&apos;m your MindCubes AI assistant. I can help you with task creation, 
                calendar management, file storage, and more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <button 
                  onClick={() => setInput('Extract tasks from this file')}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-indigo-400 font-medium mb-1">📋 Create Tasks</div>
                  <div className="text-gray-400">&quot;Extract tasks from this PDF&quot;</div>
                </button>
                <button 
                  onClick={() => setInput('Add a meeting tomorrow at 2:00 PM')}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-indigo-400 font-medium mb-1">📅 Add to Calendar</div>
                  <div className="text-gray-400">&quot;Meeting tomorrow at 2PM&quot;</div>
                </button>
                <button 
                  onClick={() => setInput('Save this file to cloud')}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-indigo-400 font-medium mb-1">☁️ Save File</div>
                  <div className="text-gray-400">&quot;Save to Drive&quot;</div>
                </button>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
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
                        Thinking process
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
                      Automation executed
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
                    <span className="text-sm text-gray-600">{thinkingText || 'Thinking'}</span>
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
              title="Attach File"
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
                placeholder={selectedFile ? "What would you like to do with this file?" : "Type something... (Shift+Enter for new line)"}
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
            Press Enter to send • Shift+Enter for new line
          </div>
          
          {/* Quick Actions */}
          <div className="max-w-4xl mx-auto mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInput('Extract tasks from this file')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              📋 Extract Tasks
            </button>
            <button
              onClick={() => setInput('Add event to calendar')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              📅 Add to Calendar
            </button>
            <button
              onClick={() => setInput('Save this file to cloud')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              ☁️ Save to Cloud
            </button>
            <button
              onClick={() => setInput('Prioritize my emails')}
              className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              📧 Prioritize Emails
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
