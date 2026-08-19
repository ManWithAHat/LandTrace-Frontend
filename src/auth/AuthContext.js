import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getTokens, clearTokens } from '../api/client';
import * as AuthApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { access } = await getTokens();
      setIsSignedIn(!!access);
      setIsLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (phone, code) => {
    const data = await AuthApi.verifyOtp(phone, code);
    setIsSignedIn(true);
    return data;
  }, []);

  const signOut = useCallback(async (refreshToken) => {
    try {
      await AuthApi.logout(refreshToken);
    } finally {
      await clearTokens();
      setIsSignedIn(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
