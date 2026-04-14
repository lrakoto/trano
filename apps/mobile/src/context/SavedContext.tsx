import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing } from '@trano/shared';

const STORAGE_KEY = 'trano_saved_listings';

interface SavedContext {
  saved:   Listing[];
  toggle:  (listing: Listing) => void;
  isSaved: (id: string) => boolean;
}

const SavedContext = createContext<SavedContext | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Listing[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSaved(JSON.parse(raw));
    });
  }, []);

  const toggle = useCallback((listing: Listing) => {
    setSaved((prev) => {
      const exists = prev.some((l) => l.id === listing.id);
      const next   = exists ? prev.filter((l) => l.id !== listing.id) : [...prev, listing];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.some((l) => l.id === id), [saved]);

  return (
    <SavedContext.Provider value={{ saved, toggle, isSaved }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
}
