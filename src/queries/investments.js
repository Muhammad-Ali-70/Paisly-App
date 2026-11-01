import { useInfiniteQuery } from '@tanstack/react-query';
import { getInvestmentsApi } from '../services/investmentService';
import { queryKeys } from './keys';

const PAGE_SIZE = 10;

/**
 * Paged investment list. The backend's list endpoint has no search
 * parameter, so searching filters the loaded rows on the device instead of
 * keying the query by search text.
 */
export const useInvestmentList = () =>
  useInfiniteQuery({
    queryKey: queryKeys.investmentList(''),
    queryFn: ({ pageParam }) =>
      getInvestmentsApi({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.pagination?.hasNextPage ? allPages.length + 1 : undefined,
    meta: { persist: true },
  });
