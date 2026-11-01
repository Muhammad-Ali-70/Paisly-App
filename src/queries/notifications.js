import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAllAsReadApi,
  markAsReadApi,
} from '../services/notificationService';
import { queryKeys } from './keys';

export const useNotifications = () =>
  useInfiniteQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ pageParam }) => getNotificationsApi({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.pagination?.hasNextPage ? allPages.length + 1 : undefined,
    meta: { persist: true },
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: async () => (await getUnreadCountApi()).count ?? 0,
    meta: { persist: true },
  });

const markInPages = (data, isTarget) =>
  data?.pages && {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      notifications: page.notifications.map(n =>
        isTarget(n) ? { ...n, read: true } : n,
      ),
    })),
  };

// Marks read locally right away; the server call follows and a failure
// simply restores the previous list and count.
const useMarkRead = (mutationFn, isTarget, countAfter) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const list = queryClient.getQueryData(queryKeys.notifications);
      const count = queryClient.getQueryData(queryKeys.unreadCount);
      queryClient.setQueryData(queryKeys.notifications, data =>
        markInPages(data, n => isTarget(n, variables)),
      );
      queryClient.setQueryData(queryKeys.unreadCount, c =>
        countAfter(c ?? 0),
      );
      return { list, count };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(queryKeys.notifications, ctx?.list);
      queryClient.setQueryData(queryKeys.unreadCount, ctx?.count);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount }),
  });
};

export const useMarkAsRead = () =>
  useMarkRead(
    id => markAsReadApi(id),
    (n, id) => n._id === id,
    c => Math.max(0, c - 1),
  );

export const useMarkAllAsRead = () =>
  useMarkRead(
    () => markAllAsReadApi(),
    () => true,
    () => 0,
  );
