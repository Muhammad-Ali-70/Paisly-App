import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Refetches the stale, mounted queries under `queryKey` when the screen
 * regains focus (tab switch, back navigation). Skips the first focus, where
 * useQuery has just fetched anyway. React Native has no window focus, so
 * TanStack's refetchOnWindowFocus only covers app foregrounding.
 */
export const useRefreshOnFocus = queryKey => {
  const queryClient = useQueryClient();
  const firstFocus = useRef(true);
  const keyRef = useRef(queryKey);
  keyRef.current = queryKey;

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      queryClient.refetchQueries({
        queryKey: keyRef.current,
        type: 'active',
        stale: true,
      });
    }, [queryClient]),
  );
};
