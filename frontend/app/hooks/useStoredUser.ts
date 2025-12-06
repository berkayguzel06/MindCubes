'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { decodeToken, isTokenExpired, getUserFromToken, JWTPayload } from '@/lib/jwt';

// Only store the token - user info is extracted from it
const TOKEN_STORAGE_KEY = 'mindcubes:token';

// User session type - derived from JWT token
export type UserSession = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: 'admin' | 'customer' | 'user';
  token: string;
};

// Legacy type for backwards compatibility
export type StoredUserSession = UserSession;

export function useStoredUser() {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Derive user info from token
  const user = useMemo<UserSession | null>(() => {
    if (!token) return null;
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Clear expired token
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      return null;
    }

    const userInfo = getUserFromToken(token);
    if (!userInfo) return null;

    return {
      ...userInfo,
      token
    };
  }, [token]);

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      // Validate token before setting
      if (!isTokenExpired(storedToken)) {
        setToken(storedToken);
      } else {
        // Clear expired token
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  // Save user (actually just saves token)
  const saveUser = useCallback((value: UserSession | string | null) => {
    if (typeof window === 'undefined') return;
    
    if (value) {
      // Accept either a full UserSession object or just a token string
      const tokenToSave = typeof value === 'string' ? value : value.token;
      window.localStorage.setItem(TOKEN_STORAGE_KEY, tokenToSave);
      setToken(tokenToSave);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
    }
  }, []);

  // Save just the token (preferred method)
  const saveToken = useCallback((newToken: string | null) => {
    if (typeof window === 'undefined') return;
    
    if (newToken) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      setToken(newToken);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    // Also clean up any legacy storage
    window.localStorage.removeItem('mindcubes:userSession');
    window.localStorage.removeItem('mindcubes:userProfile');
    setToken(null);
  }, []);

  // Check if user has a specific role
  const hasRole = useCallback((requiredRole: 'admin' | 'customer' | 'user'): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<string, number> = {
      'user': 0,
      'customer': 1,
      'admin': 2
    };

    const userLevel = roleHierarchy[user.role] ?? 0;
    const requiredLevel = roleHierarchy[requiredRole] ?? 0;

    return userLevel >= requiredLevel;
  }, [user]);

  // Check if user is admin
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  return { 
    user, 
    token,
    saveUser, 
    saveToken,
    logout,
    hasRole,
    isAdmin,
    hydrated 
  };
}


