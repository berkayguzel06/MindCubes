'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { StoredUserSession } from '../hooks/useStoredUser';

type SidebarUserCardProps = {
  user: StoredUserSession | null;
  onLogout: () => void;
};

export default function SidebarUserCard({ user, onLogout }: SidebarUserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const displayName = user ? `${user.name} ${user.lastName}` : 'Guest User';
  const email = user?.email ?? 'guest@example.com';
  const role = user?.role ?? 'guest';

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    customer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    guest: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 text-left focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-white truncate">{displayName}</div>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium uppercase rounded border ${roleColors[role] || roleColors.guest}`}>
              {role}
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">{email}</div>
        </div>
      </button>

      {menuOpen && (
        <div className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 z-30 w-64 bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-lg p-3 space-y-2.5">
          {user ? (
            <>
              <Link
                href="/credentials"
                onClick={() => setMenuOpen(false)}
                className="block text-left text-sm text-white px-3 py-2 rounded-md border border-white/10 hover:bg-white/10 transition-colors"
              >
                Credentials
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-left text-sm text-white px-3 py-2 rounded-md border border-red-500/40 hover:bg-red-500/20 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </div>
  );
}


