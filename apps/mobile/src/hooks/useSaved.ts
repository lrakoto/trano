import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing } from '@trano/shared';

const STORAGE_KEY = 'trano_saved_listings';

export function useSaved() {
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

  return { saved, toggle, isSaved };
}
