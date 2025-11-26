'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarCredentialsPanel from '@/app/components/SidebarCredentialsPanel';
import SidebarMicrosoftCard from '@/app/components/SidebarMicrosoftCard';
import { useStoredUser } from '@/hooks/useStoredUser';

export default function CredentialsPage() {
  const router = useRouter();
  const { user, hydrated } = useStoredUser();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    }
  }, [hydrated, router, user]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 -left-32 h-96 w-96 rounded-full bg-indigo-500/30 blur-[150px]" />
        <div className="absolute top-1/3 right-0 h-64 w-64 rounded-full bg-purple-500/20 blur-[180px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs uppercase tracking-[0.2em] text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Credential Management</h1>
            <p className="mt-2 max-w-2xl text-base text-gray-400">
              Review and update the safe-to-display fields we received during your Microsoft
              authorization. These values are only used to orchestrate automated workflows on your behalf.
            </p>
          </div>
          <div className="flex gap-4 text-sm text-gray-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-gray-400">User</p>
              <p className="font-semibold">{user.name} {user.lastName}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 px-5 py-3 backdrop-blur md:block">
              <p className="text-xs uppercase tracking-wide text-white/70">Status</p>
              <p className="text-lg font-semibold">Secure Vault</p>
              <p className="text-xs text-white/70">Data stays encrypted at rest.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Update</p>
                <h2 className="text-2xl font-semibold">Share-safe credential fields</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                Microsoft OAuth
              </span>
            </div>
            <div className="mt-6">
              <SidebarCredentialsPanel token={user.token} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Guide</p>
              <h3 className="mt-2 text-lg font-semibold">Why do we need these fields?</h3>
              <p className="mt-2 text-sm text-gray-300">
                Telegram chat IDs let us route Microsoft-triggered workflows back to you. Feel free to
                define a private ID if you want an additional mapping layer.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Transparent data visibility
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Easily editable fields
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Encrypted, access-controlled storage
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Tip</p>
                <p className="mt-2 text-sm text-gray-300">
                  Removing Microsoft access from the sidebar menu wipes these values automatically.
                  Reconnect any time to edit the fields again.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-200">Microsoft Auth</p>
                <div className="mt-3">
                  <SidebarMicrosoftCard user={user} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


