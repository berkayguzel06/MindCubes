'use client';

import { useStoredUser } from '../hooks/useStoredUser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationPanel, { NotificationType } from '../components/NotificationPanel';
import Sidebar from '../components/Sidebar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  version_id?: string;
  tags?: Array<{ id: string; name: string; createdAt?: string; updatedAt?: string }>;
  is_enabled_for_user?: boolean;
}

export default function Agents() {
  const router = useRouter();
  const { user, token, logout, hydrated } = useStoredUser();
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [importing, setImporting] = useState(false);
  const [executeModal, setExecuteModal] = useState<{
    isOpen: boolean;
    workflowId: string;
    workflowName: string;
  }>({ isOpen: false, workflowId: '', workflowName: '' });
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState(user?.id ?? 'guest');
  const [webhookPath, setWebhookPath] = useState('');
  const [executing, setExecuting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    isOpen: boolean;
  }>({ message: '', type: 'info', isOpen: false });
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    workflowId: string;
    workflowName: string;
  }>({ isOpen: false, workflowId: '', workflowName: '' });
  const [promptText, setPromptText] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [updatingSettings, setUpdatingSettings] = useState<string | null>(null);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    setNotification({ message, type, isOpen: true });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  // Fetch workflows from n8n via backend
  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchWorkflows();
  }, [hydrated, user, router]);

  useEffect(() => {
    setUserId(user?.id ?? 'guest');
  }, [user]);

  const allTags = Array.from(
    new Set(
      workflows.flatMap((wf) => (wf.tags || []).map((t) => t.name))
    )
  ).sort((a, b) => a.localeCompare(b));

  const backupWorkflows = async () => {
    if (!token) return;
    try {
      setBackingUp(true);
      const response = await fetch(`${API_BASE_URL}/n8n/workflows/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          data.message || `Workflow backup completed. Total ${data.count ?? 0} workflows saved.`,
          'success'
        );
      } else {
        showNotification(
          data.message || 'An error occurred while backing up workflows.',
          'error'
        );
      }
    } catch (err) {
      console.error('Error backing up workflows:', err);
      showNotification('An error occurred while backing up workflows. Check console for details.', 'error');
    } finally {
      setBackingUp(false);
    }
  };

  const importWorkflows = async () => {
    if (!token) return;
    try {
      setImporting(true);
      const response = await fetch(`${API_BASE_URL}/n8n/workflows/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        // Hata detaylarını konsola da yaz
        console.error('Workflow import errors:', data.errors);

        const failedFilesPreview = data.errors
          .slice(0, 5)
          .map((e: any) => `${e.file}: ${e.message}`)
          .join(' | ');

        showNotification(
          data.message ||
          `Workflow import completed with errors. Imported: ${data.importedCount ?? 0}, Failed: ${data.errorCount ?? data.errors.length
          }. ${failedFilesPreview}`,
          'error'
        );
      } else if (data.success) {
        showNotification(
          data.message || `Workflow import completed. Total ${data.importedCount ?? 0} workflows imported.`,
          'success'
        );
        // Import sonrası listeleri güncelle
        fetchWorkflows();
      } else {
        showNotification(
          data.message || 'An error occurred while importing workflows.',
          'error'
        );
      }
    } catch (err) {
      console.error('Error importing workflows:', err);
      showNotification('An error occurred while importing workflows. Check console for details.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const fetchWorkflows = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/n8n/workflows`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch workflows');
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError('Failed to connect to n8n. Make sure n8n is running and the API key is configured.');
    } finally {
      setLoading(false);
    }
  };

  const openPromptModal = async (workflowId: string, workflowName: string) => {
    if (!userId || !token) return;

    setPromptModal({ isOpen: true, workflowId, workflowName });
    setPromptText('');
    setPromptLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/n8n/workflows/${workflowId}/prompt`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();

      if (data.success && data.data) {
        setPromptText(data.data.prompt || '');
      } else {
        setPromptText('');
      }
    } catch (err) {
      console.error('Error fetching workflow prompt:', err);
      showNotification('An error occurred while loading the prompt.', 'error');
    } finally {
      setPromptLoading(false);
    }
  };

  const closePromptModal = () => {
    setPromptModal({ isOpen: false, workflowId: '', workflowName: '' });
    setPromptText('');
    setPromptLoading(false);
  };

  const savePrompt = async () => {
    if (!promptModal.workflowId || !token) return;

    try {
      setPromptLoading(true);
      const response = await fetch(`${API_BASE_URL}/n8n/workflows/${promptModal.workflowId}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: promptText
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Prompt saved successfully.', 'success');
        closePromptModal();
      } else {
        showNotification(data.message || 'An error occurred while saving the prompt.', 'error');
      }
    } catch (err) {
      console.error('Error saving prompt:', err);
      showNotification('An error occurred while saving the prompt.', 'error');
    } finally {
      setPromptLoading(false);
    }
  };

  const toggleWorkflowForUser = async (workflowId: string, currentlyEnabled: boolean) => {
    if (!token) return;

    try {
      setUpdatingSettings(workflowId);
      const response = await fetch(`${API_BASE_URL}/n8n/workflows/${workflowId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isEnabled: !currentlyEnabled
        })
      });

      const data = await response.json();

      if (!data.success) {
        showNotification(data.message || 'Failed to update workflow settings for user.', 'error');
        return;
      }

      // Optimistically update local state
      setWorkflows((prev) =>
        prev.map((wf) =>
          wf.id === workflowId
            ? {
              ...wf,
              is_enabled_for_user: !currentlyEnabled
            }
            : wf
        )
      );
    } catch (err) {
      console.error('Error updating workflow settings for user:', err);
      showNotification('Failed to update workflow settings for user. Check console for details.', 'error');
    } finally {
      setUpdatingSettings(null);
    }
  };

  const openExecuteModal = (workflowId: string, workflowName: string) => {
    setExecuteModal({ isOpen: true, workflowId, workflowName });
    setChatInput('');
    setSelectedFile(null);
    setWebhookPath('');
  };

  const closeExecuteModal = () => {
    setExecuteModal({ isOpen: false, workflowId: '', workflowName: '' });
    setChatInput('');
    setSelectedFile(null);
    setWebhookPath('');
  };

  const executeWorkflow = async () => {
    if (!chatInput.trim() || !token) {
      showNotification('Please enter a chat message.', 'error');
      return;
    }

    try {
      setExecuting(true);

      const formData = new FormData();
      formData.append('chatInput', chatInput);
      formData.append('userId', userId);

      if (webhookPath) {
        formData.append('webhookPath', webhookPath);
      }

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/n8n/workflows/${executeModal.workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData // Don't set Content-Type, browser will set it with boundary
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Workflow executed successfully.', 'success');
        closeExecuteModal();
      } else {
        showNotification(`Failed to execute workflow: ${data.message}`, 'error');
      }
    } catch (err) {
      console.error('Error executing workflow:', err);
      showNotification('Failed to execute workflow. Check console for details.', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Execute workflow directly without opening the data input modal
  // Used for workflows that DON'T have the `data-input` tag
  const executeWorkflowDirect = async (workflowId: string) => {
    if (!token) return;
    try {
      setExecuting(true);

      const formData = new FormData();
      formData.append('userId', userId);

      const response = await fetch(`${API_BASE_URL}/n8n/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Workflow executed successfully.', 'success');
      } else {
        showNotification(`Failed to execute workflow: ${data.message}`, 'error');
      }
    } catch (err) {
      console.error('Error executing workflow:', err);
      showNotification('Failed to execute workflow. Check console for details.', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const toggleWorkflowActive = async (workflowId: string, currentActive: boolean) => {
    if (!token) return;
    try {
      const endpoint = currentActive ? 'deactivate' : 'activate';
      const response = await fetch(`${API_BASE_URL}/n8n/workflows/${workflowId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Refresh workflows
        fetchWorkflows();
      } else {
        showNotification(`Failed to update workflow: ${data.message}`, 'error');
      }
    } catch (err) {
      console.error('Error toggling workflow:', err);
      showNotification('Failed to update workflow. Check console for details.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
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

      <NotificationPanel
        message={notification.message}
        type={notification.type}
        isOpen={notification.isOpen}
        onClose={closeNotification}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        <div className="p-8">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">AI Agents</h1>
              <p className="text-gray-400 text-sm">Manage and execute your agents</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={backupWorkflows}
                disabled={backingUp}
                className="px-4 py-2 bg-purple-500/20 text-purple-200 text-sm rounded-full font-medium hover:bg-purple-500/30 transition-colors border border-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backingUp ? '💾 Backing up...' : '💾 Backup Workflows'}
              </button>
              <button
                onClick={importWorkflows}
                disabled={importing}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-200 text-sm rounded-full font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? '↩ Importing...' : '↩ Import Workflows'}
              </button>
              <button
                onClick={fetchWorkflows}
                className="px-4 py-2 bg-white/10 text-white text-sm rounded-full font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                🔄 Refresh
              </button>
            </div>
          </header>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-8">
            <div>
              <span className="text-sm text-gray-400 mr-2">Filter by tag:</span>
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="bg-slate-900/70 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/60 backdrop-blur-sm"
              >
                <option className="text-gray-900" value="all">
                  All
                </option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag} className="text-gray-900">
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              <p className="text-gray-400 text-sm">Create workflows in n8n to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows
                .filter((workflow) => {
                  if (selectedTagFilter === 'all') return true;
                  const tagNames = (workflow.tags || []).map((t) => t.name.toLowerCase());
                  return tagNames.includes(selectedTagFilter.toLowerCase());
                })
                .map((workflow) => {
                  const tagNames = (workflow.tags || []).map((t) => t.name.toLowerCase());
                  const hasDataInput = tagNames.includes('data-input');
                  const hasEditable = tagNames.includes('editable');
                  const hasStart = tagNames.includes('start');
                  const isActive = workflow.active;
                  const isEnabledForUser = workflow.is_enabled_for_user !== false;

                  return (
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
                        <div className={`px-2 py-1 text-xs rounded-full border ${workflow.active
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
                        <div className="flex items-center gap-2">
                          {hasStart && (
                            <button
                              onClick={() => toggleWorkflowForUser(workflow.id, isEnabledForUser)}
                              disabled={updatingSettings === workflow.id}
                              className={`text-xs px-3 py-1 rounded-full border transition-colors ${isEnabledForUser
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                                : 'border-gray-500/40 bg-gray-700/40 text-gray-300 hover:bg-gray-600/60'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {updatingSettings === workflow.id
                                ? 'Updating...'
                                : isEnabledForUser
                                  ? 'Disable for me'
                                  : 'Enable for me'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasEditable && (
                            <button
                              onClick={() => openPromptModal(workflow.id, workflow.name)}
                              className="text-xs px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 transition-colors"
                            >
                              ✏️ Edit Prompt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Execute Modal */}
      {executeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Execute Workflow</h2>
              <button
                onClick={closeExecuteModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-4">
                Workflow: <span className="text-white font-medium">{executeModal.workflowName}</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                  placeholder="Enter user ID"
                />
              </div>

              {/* Webhook Path (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook Path (Optional)
                </label>
                <input
                  type="text"
                  value={webhookPath}
                  onChange={(e) => setWebhookPath(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                  placeholder="e.g., chat-workflow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If your workflow has a webhook, enter its path here (e.g., 'my-webhook')
                </p>
              </div>

              {/* Chat Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chat Message *
                </label>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                  placeholder="Enter your message or prompt..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload File (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-400 hover:border-purple-500/50 transition-colors flex items-center justify-between">
                      <span className="text-sm truncate">
                        {selectedFile ? selectedFile.name : 'Choose a file...'}
                      </span>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.json"
                    />
                  </label>
                  {selectedFile && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-2">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeExecuteModal}
                className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeWorkflow}
                disabled={executing || !chatInput.trim()}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {executing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Executing...
                  </>
                ) : (
                  <>
                    ▶ Execute Workflow
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Workflow Prompt</h2>
              <button
                onClick={closePromptModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Workflow: <span className="text-white font-medium">{promptModal.workflowName}</span>
              </p>
              <p className="text-xs text-gray-500">
                This prompt is stored per user and can be used when executing this workflow.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prompt
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                  placeholder="Write the default prompt you want to use for this workflow..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closePromptModal}
                className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePrompt}
                disabled={promptLoading}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {promptLoading ? 'Saving...' : 'Save Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
