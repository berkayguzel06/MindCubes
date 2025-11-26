'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

type DisplayableCredentials = {
  telegramChatId: string | null;
  ctelegramChatId: string | null;
  expiresAt: string | null;
  createdAt: string | null;
};

type SidebarCredentialsPanelProps = {
  token: string;
  active?: boolean;
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function SidebarCredentialsPanel({ token, active = true }: SidebarCredentialsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [credentials, setCredentials] = useState<DisplayableCredentials | null>(null);
  const [formValues, setFormValues] = useState({
    telegramChatId: '',
    ctelegramChatId: ''
  });

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const populateFromPayload = useCallback((payload: DisplayableCredentials | null) => {
    setCredentials(payload);
    setFormValues({
      telegramChatId: payload?.telegramChatId ?? '',
      ctelegramChatId: payload?.ctelegramChatId ?? ''
    });
  }, []);

  const fetchCredentials = useCallback(async () => {
    if (!token) return;
    resetFeedback();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/credentials`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Credentials could not be fetched');
      }

      const nextCredentials = payload?.data?.credentials ?? null;
      setHasCredentials(Boolean(payload?.data?.hasCredentials));
      populateFromPayload(nextCredentials);
    } catch (err) {
      setHasCredentials(false);
      populateFromPayload(null);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [token, populateFromPayload, resetFeedback]);

  useEffect(() => {
    if (!active) return;
    fetchCredentials();
  }, [active, fetchCredentials]);

  const sanitizeChatIdInput = (rawValue: string) => {
    if (!rawValue) return '';
    return rawValue.replace(/[^\d-]/g, '');
  };

  const handleChange = (field: 'telegramChatId' | 'ctelegramChatId', value: string) => {
    resetFeedback();
    setFormValues((prev) => ({
      ...prev,
      [field]: sanitizeChatIdInput(value)
    }));
  };

  const disableSave = useMemo(() => {
    if (!hasCredentials) return true;
    if (!credentials) return false;
    return (
      formValues.telegramChatId === (credentials.telegramChatId ?? '') &&
      formValues.ctelegramChatId === (credentials.ctelegramChatId ?? '')
    );
  }, [credentials, formValues, hasCredentials]);

  const handleSave = async () => {
    if (!token || disableSave) return;
    resetFeedback();
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/credentials`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegramChatId: formValues.telegramChatId.trim() || null,
          ctelegramChatId: formValues.ctelegramChatId.trim() || null
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Credentials could not be updated');
      }

      const updated = payload?.data?.credentials ?? null;
      setHasCredentials(Boolean(updated));
      populateFromPayload(updated);
      setSuccess('Credentials updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          Credentials
        </p>
        <p className="text-xs text-gray-400">
          Safe-to-share details coming from your Microsoft authorization
        </p>
      </div>

      {!loading && !hasCredentials && (
        <p className="text-xs text-amber-300/90 bg-amber-900/20 border border-amber-500/20 rounded-md px-2 py-1">
          We could not find any shareable credentials yet. Complete the Microsoft authorization to
          have them listed here.
        </p>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Loading details...</p>
      ) : (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-300">Telegram Chat ID</span>
            <input
              type="text"
              inputMode="text"
              pattern="[0-9-]*"
              value={formValues.telegramChatId}
              onChange={(event) => handleChange('telegramChatId', event.target.value)}
              className="w-full rounded-md bg-gray-800/60 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
              placeholder="e.g. 5123-456-789"
              disabled={!hasCredentials || saving}
            />
          </label>

          {credentials && (
            <div className="rounded-md bg-black/20 border border-white/5 px-2 py-1 text-[11px] text-gray-400 space-y-1">
              <p>
                <span className="text-gray-500">Created:</span> {formatDate(credentials.createdAt)}
              </p>
              <p>
                <span className="text-gray-500">Access token expiry:</span>{' '}
                {formatDate(credentials.expiresAt)}
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-300 bg-red-900/30 border border-red-500/20 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-200 bg-emerald-900/30 border border-emerald-500/20 rounded-md px-2 py-1">
              {success}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || disableSave || !hasCredentials}
            className="w-full rounded-md bg-indigo-500/80 hover:bg-indigo-400 text-sm font-medium text-white py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </>
      )}
    </div>
  );
}


