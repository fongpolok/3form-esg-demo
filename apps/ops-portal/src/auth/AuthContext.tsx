import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CurrentUserDto } from '@esg/shared-types';
import type { LoginInput } from '@esg/shared-validation';
import { fetchCurrentUser, login as loginRequest } from '../api/auth';
import { getStoredToken, setStoredToken } from '../api/client';

interface AuthContextValue {
  user: CurrentUserDto | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserDto | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setStatus('anonymous');
      return;
    }
    fetchCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch(() => {
        // Stored token is expired/invalid — drop it silently and fall back
        // to the login screen rather than looping on a failing request.
        setStoredToken(null);
        setStatus('anonymous');
      });
  }, []);

  async function login(input: LoginInput) {
    const response = await loginRequest(input);
    setStoredToken(response.accessToken);
    setUser(response.user);
    setStatus('authenticated');
  }

  function logout() {
    setStoredToken(null);
    setUser(null);
    setStatus('anonymous');
  }

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
