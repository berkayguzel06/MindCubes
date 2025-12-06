'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StoredUserSession } from '@/hooks/useStoredUser';

const MICROSOFT_AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_AUTH_PARAMS = {
  client_id: '22c7a263-dc1c-4b96-8e72-d86990737b9b',
  response_type: 'code',
  redirect_uri: 'http://localhost:5678/webhook/oauth2/callback',
  response_mode: 'query',
  scope: 'openid profile email offline_access User.Read Calendars.ReadWrite Mail.ReadWrite',
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

type SidebarMicrosoftCardProps = {
  user: StoredUserSession;
};

export default function SidebarMicrosoftCard({ user }: SidebarMicrosoftCardProps) {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const microsoftAuthUrl = useMemo(() => {
    const statePayload = JSON.stringify({
      name: user.name,
      lastName: user.lastName,
      email: user.email
    });
    const params = new URLSearchParams({
      ...MICROSOFT_AUTH_PARAMS,
      state: statePayload
    });
    return `${MICROSOFT_AUTH_BASE}?${params.toString()}`;
  }, [user]);

  useEffect(() => {
    if (!user?.token) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/credentials`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        if (!response.ok) {
          setHasCredentials(false);
          return;
        }
        const data = await response.json();
        setHasCredentials(Boolean(data?.data?.hasCredentials));
      } catch {
        setHasCredentials(false);
      }
    };

    fetchStatus();
  }, [user]);

  const handleRevoke = async () => {
    if (!user?.token) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/credentials`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        setHasCredentials(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="border border-white/10 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">Microsoft Auth</p>
        <p className="text-xs text-gray-400">
          {hasCredentials
            ? 'Your account is authorized with Microsoft.'
            : 'Continue to Microsoft to link your account and share credentials.'}
        </p>
      </div>
      {hasCredentials ? (
        <button
          type="button"
          onClick={handleRevoke}
          disabled={actionLoading}
          className="w-full text-center bg-red-500/80 hover:bg-red-400 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {actionLoading ? 'Revoking...' : 'Remove Authorization'}
        </button>
      ) : (
        <a
          href={microsoftAuthUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="block text-center bg-indigo-500/90 hover:bg-indigo-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Authorize
        </a>
      )}
    </div>
  );
}


