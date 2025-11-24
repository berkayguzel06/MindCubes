'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export default function Agents() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch workflows from n8n via backend
  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/n8n/workflows');
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch workflows');
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError('Failed to connect to n8n. Make sure n8n is running and API key is configured.');
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/n8n/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: {} })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Workflow triggered successfully!');
      } else {
        alert('Failed to trigger workflow: ' + data.message);
      }
    } catch (err) {
      console.error('Error executing workflow:', err);
      alert('Failed to execute workflow. Check console for details.');
    }
  };

  const toggleWorkflowActive = async (workflowId: string, currentActive: boolean) => {
    try {
      const endpoint = currentActive ? 'deactivate' : 'activate';
      const response = await fetch(`http://localhost:5000/api/v1/n8n/workflows/${workflowId}/${endpoint}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh workflows
        fetchWorkflows();
      } else {
        alert('Failed to update workflow: ' + data.message);
      }
    } catch (err) {
      console.error('Error toggling workflow:', err);
      alert('Failed to update workflow. Check console for details.');
    }
  };

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
          {/* <Link href="/tasks" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <span className="w-2 h-2 bg-gray-600 rounded-full" />
            Tasks
          </Link> */}
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
              <h1 className="text-2xl font-bold text-white mb-1">n8n Workflows</h1>
              <p className="text-gray-400 text-sm">Manage and execute your n8n automation workflows</p>
            </div>
            <button 
              onClick={fetchWorkflows}
              className="px-4 py-2 bg-white/10 text-white text-sm rounded-full font-medium hover:bg-white/20 transition-colors border border-white/20"
            >
              🔄 Refresh
            </button>
          </header>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading workflows...</div>
            </div>
          ) : error ? (
            <div className="glass-panel p-6 rounded-xl border border-red-500/20 bg-red-500/5">
              <h3 className="text-red-400 font-medium mb-2">Error</h3>
              <p className="text-gray-400 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-4">
                Make sure n8n is running on http://localhost:5678 and you have set the N8N_API_KEY in your backend .env file
              </p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="glass-panel p-12 rounded-xl border border-white/5 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-2">No Workflows Found</h3>
              <p className="text-gray-400 text-sm">Create workflows in n8n to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <div 
                  key={workflow.id} 
                  className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full border ${
                      workflow.active 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {workflow.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-white mb-2 truncate" title={workflow.name}>
                    {workflow.name}
                  </h3>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    {workflow.tags && workflow.tags.length > 0 
                      ? `Tags: ${workflow.tags.map(t => t.name).join(', ')}`
                      : 'No tags'
                    }
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-2">
                    <button 
                      onClick={() => toggleWorkflowActive(workflow.id, workflow.active)}
                      className="text-xs text-white hover:underline px-2 py-1 rounded hover:bg-white/5 transition-colors"
                    >
                      {workflow.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => executeWorkflow(workflow.id)}
                      className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                    >
                      ▶ Execute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
