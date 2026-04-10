import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@trano/shared';
import { API_BASE_URL } from '../constants';

const TOKEN_KEY = 'trano_jwt';

interface AuthState {
  user:     User | null;
  token:    string | null;
  loading:  boolean;
}

interface AuthContext extends AuthState {
  login:    (phone: string, password: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout:   () => Promise<void>;
}

interface RegisterParams {
  name:     string;
  phone:    string;
  password: string;
  role?:    'BUYER' | 'SELLER' | 'AGENT';
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  // Rehydrate token from secure storage on launch
  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then(async (token) => {
      if (token) {
        try {
          const user = await fetchMe(token);
          setState({ user, token, loading: false });
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setState({ user: null, token: null, loading: false });
        }
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Tsy voamarina ny fampidirana');
    }
    const { user, token } = await res.json();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setState({ user, token, loading: false });
  };

  const register = async (params: RegisterParams) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Tsy vita ny fanisana');
    }
    const { user, token } = await res.json();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setState({ user, token, loading: false });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContext {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Token invalid');
  return res.json();
}
