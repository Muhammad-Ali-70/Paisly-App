import { AppState, Platform } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { mmkvStorage } from './storage';

const DAY = 24 * 60 * 60 * 1000;

// Refetch stale queries when the app returns to the foreground
focusManager.setEventListener(handleFocus => {
  if (Platform.OS === 'web') return undefined;
  const subscription = AppState.addEventListener('change', state =>
    handleFocus(state === 'active'),
  );
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Revisits within 30s reuse data; after that it is shown and refetched
      staleTime: 30 * 1000,
      // Must outlive the persisted cache, or restored entries get collected
      gcTime: 7 * DAY,
      retry: 1,
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: 'paisly-query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister,
  maxAge: 7 * DAY,
  dehydrateOptions: {
    // Only queries that opt in via `meta: { persist: true }` survive restarts
    shouldDehydrateQuery: query =>
      query.state.status === 'success' && query.meta?.persist === true,
  },
};

/** Drops every cached server response, in memory and on disk (logout). */
export const clearQueryCache = () => {
  queryClient.clear();
  persister.removeClient();
};
