import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useApi } from '@/lib/api';

const AppDataContext = createContext(null);

/**
 * Loads and holds the signed-in user's CentralHub data. Mounted inside the
 * authenticated shell. Runs /api/auth/sync first (creates the profile + seeds
 * preferences on first login), then loads everything the dashboard needs.
 */
export function AppDataProvider({ children }) {
  const api = useApi();
  const [state, setState] = useState({
    loading: true,
    error: null,
    user: null,
    platforms: [],
    categories: [],
    preferences: {}, // platformId -> { isVisible, isFavorite }
    recentlyUsed: [],
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { user } = await api.post('/auth/sync');
      const [{ platforms }, { categories }, { preferences }, { recentlyUsed }] =
        await Promise.all([
          api.get('/platforms'),
          api.get('/categories'),
          api.get('/preferences'),
          api.get('/recently-used'),
        ]);

      const prefMap = {};
      for (const p of preferences) {
        prefMap[p.platformId] = { isVisible: p.isVisible, isFavorite: p.isFavorite };
      }

      setState({
        loading: false,
        error: null,
        user,
        platforms,
        categories,
        preferences: prefMap,
        recentlyUsed,
      });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err }));
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  // Toggle visibility/favorite for one platform. Optimistic update.
  const updatePreference = useCallback(
    async (platformId, patch) => {
      setState((s) => ({
        ...s,
        preferences: {
          ...s.preferences,
          [platformId]: {
            isVisible: true,
            isFavorite: false,
            ...s.preferences[platformId],
            ...patch,
          },
        },
      }));
      const { preference } = await api.put(`/preferences/${platformId}`, patch);
      setState((s) => ({
        ...s,
        preferences: {
          ...s.preferences,
          [platformId]: { isVisible: preference.isVisible, isFavorite: preference.isFavorite },
        },
      }));
    },
    [api]
  );

  const resetPreferences = useCallback(async () => {
    const { preferences } = await api.post('/preferences/reset');
    const prefMap = {};
    for (const p of preferences) {
      prefMap[p.platformId] = { isVisible: p.isVisible, isFavorite: p.isFavorite };
    }
    setState((s) => ({ ...s, preferences: prefMap }));
  }, [api]);

  // Record a platform open, then refresh the recently-used list.
  const recordOpen = useCallback(
    async (platformId) => {
      try {
        await api.post(`/recently-used/${platformId}`);
        const { recentlyUsed } = await api.get('/recently-used');
        setState((s) => ({ ...s, recentlyUsed }));
      } catch {
        // Non-critical - opening the platform still succeeds.
      }
    },
    [api]
  );

  const value = { ...state, reload: load, updatePreference, resetPreferences, recordOpen };
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
