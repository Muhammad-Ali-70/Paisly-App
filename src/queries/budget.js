import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBudgetTemplatesApi,
  getCurrentBudgetApi,
  saveBudgetApi,
} from '../services/budgetService';
import { queryKeys } from './keys';

/**
 * Current month's budget with spending. The API answers `{ budget: null,
 * spending: null }` (200) when none is set, so "no budget" is data, not an error.
 */
export const useCurrentBudget = () =>
  useQuery({
    queryKey: queryKeys.budget,
    queryFn: getCurrentBudgetApi,
    meta: { persist: true },
  });

export const useBudgetTemplates = income =>
  useQuery({
    queryKey: queryKeys.budgetTemplates(income),
    queryFn: () => getBudgetTemplatesApi(income),
    // Static suggestions; no need to refetch during a session
    staleTime: Infinity,
  });

export const useSaveBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBudgetApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      // The dashboard embeds the budget (Home's spending card)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
