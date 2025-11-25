'use client';

import { useCallback, useEffect, useState } from 'react';

export type StoredUserSession = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  token: string;
};

const SESSION_STORAGE_KEY = 'mindcubes:userSession';

export function useStoredUser() {
  const [user, setUser] = useState<StoredUserSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredUserSession;
        setUser(parsed);
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const saveUser = useCallback((value: StoredUserSession | null) => {
    if (typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
      setUser(value);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      setUser(null);
    }
  }, []);

  return { user, saveUser, hydrated };
}


