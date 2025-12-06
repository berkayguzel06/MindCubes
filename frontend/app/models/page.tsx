'use client';

import { useStoredUser } from '../hooks/useStoredUser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

interface OllamaModel {
  id: string;
  name: string;
  modifiedAt: string;
  size: number;
  digest: string;
  parameterSize: string;
  quantizationLevel: string;
  family: string;
  format: string;
  status: string;
}

export default function Models() {
  const router = useRouter();
  const { user, token, logout, hydrated } = useStoredUser();
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    const fetchModels = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/models/ollama`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setModels(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch models');
          setModels([]);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to connect to Ollama service');
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    if (hydrated && user && token) {
      fetchModels();
    }
  }, [hydrated, user, token]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getModelInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getModelColor = (family: string) => {
    const familyLower = family.toLowerCase();
    if (familyLower.includes('llama')) return 'purple';
    if (familyLower.includes('mistral')) return 'blue';
    if (familyLower.includes('phi')) return 'green';
    if (familyLower.includes('gemma')) return 'orange';
    return 'pink';
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <div className="p-8">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">AI Models</h1>
              <p className="text-gray-400 text-sm">Ollama models available on your system</p>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading models...</div>
            </div>
          ) : error ? (
            <div className="glass-panel p-6 rounded-xl border border-red-500/20">
              <div className="text-red-400 mb-2">⚠️ {error}</div>
              <p className="text-sm text-gray-400">Make sure Ollama is running on your system.</p>
            </div>
          ) : models.length === 0 ? (
            <div className="glass-panel p-6 rounded-xl border border-white/5">
              <div className="text-gray-400 text-center">
                <p className="mb-2">No models found</p>
                <p className="text-sm text-gray-500">Install models using: <code className="bg-white/10 px-2 py-1 rounded">ollama pull &lt;model-name&gt;</code></p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => {
                const color = getModelColor(model.family);
                const colorClasses = {
                  purple: 'bg-purple-500/20 text-purple-400',
                  blue: 'bg-blue-500/20 text-blue-400',
                  green: 'bg-green-500/20 text-green-400',
                  orange: 'bg-orange-500/20 text-orange-400',
                  pink: 'bg-pink-500/20 text-pink-400'
                };

                return (
                  <div key={model.id} className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.pink} rounded-lg flex items-center justify-center`}>
                        <span className="font-bold">{getModelInitial(model.name)}</span>
                      </div>
                      <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                        {model.status}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">{model.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {model.family} model • {model.parameterSize} • {model.quantizationLevel}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs text-gray-500">{formatBytes(model.size)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
