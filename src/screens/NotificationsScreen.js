import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Bell, CheckCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '@hooks/useThemeColors';
import ScreenHeader from '../components/common/Screenheader';
import SkeletonSection from '../components/common/skeleton/SkeletonSection';
import ApprovalCard from '../components/investment/ApprovalCard';
import useNotificationStore from '../store/useNotificationStore';
import { hp, wp } from '../constants/responsive';
import { borderRadius, Label } from '../constants/globalstyle';
import {
  approveReturnApi,
  rejectReturnApi,
} from '../services/investmentService';

  const TYPE_COLORS = {
    budget_warning: '#F59E0B',
    budget_exceeded: '#EF4444',
    category_warning: '#F59E0B',
    category_exceeded: '#EF4444',
    investment_return: '#10B981',
  };

  const NotificationItem = ({ item, onPress, onApprove, onReject, loading, s }) => {
    if (item.type === 'investment_return' && !item.read) {
      return (
        <ApprovalCard
          title={item.title}
          message={item.message}
          amount={item.data?.amount}
          onApprove={() => onApprove(item)}
          onReject={() => onReject(item)}
          loading={loading}
        />
      );
    }

    return (
      <TouchableOpacity
        style={[s.item, !item.read && s.itemUnread]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            s.iconWrap,
            { backgroundColor: (TYPE_COLORS[item.type] || '#F59E0B') + '20' },
          ]}
        >
          <Bell
            size={wp(5)}
            color={TYPE_COLORS[item.type] || '#F59E0B'}
            strokeWidth={1.8}
          />
        </View>
        <View style={s.itemContent}>
          <Label
            type="bodySmall"
            weight={item.read ? 'regular' : 'semiBold'}
            color="textMain"
          >
            {item.title}
          </Label>
          <Label type="bodyXs" weight="regular" color="textMuted" style={s.message}>
            {item.message}
          </Label>
          <Label type="caption" weight="regular" color="textMuted">
            {new Date(item.createdAt).toLocaleDateString()}
          </Label>
        </View>
        {!item.read && (
          <View
            style={[
              s.dot,
              { backgroundColor: TYPE_COLORS[item.type] || '#F59E0B' },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

const NotificationScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const nav = useNavigation();
  const [processingIds, setProcessingIds] = useState({});
  const {
    notifications,
    loading,
    loadingMore,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications({ page: 1 });
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(
    async (notification) => {
      if (!notification.read) {
        await markAsRead(notification._id);
      }

      if (notification.type === 'budget_warning' || notification.type === 'budget_exceeded') {
        nav.navigate('TabNavigator', { screen: 'Plan' });
      } else if (notification.type === 'category_warning' || notification.type === 'category_exceeded') {
        nav.navigate('TabNavigator', {
          screen: 'Plan',
          params: {
            screen: 'CategoryDetail',
            params: { category: notification.data?.category },
          },
        });
      }
    },
    [markAsRead, nav],
  );

  const handleApproveReturn = useCallback(
    async (notification) => {
      const { investmentId, returnId } = notification.data || {};
      if (!investmentId || !returnId) return;

      setProcessingIds(prev => ({ ...prev, [notification._id]: true }));
      try {
        await approveReturnApi(investmentId, returnId);
        await markAsRead(notification._id);
        fetchNotifications({ page: 1 });
      } catch (e) {
        Alert.alert('Error', e?.message || 'Failed to approve return');
      } finally {
        setProcessingIds(prev => ({ ...prev, [notification._id]: false }));
      }
    },
    [markAsRead, fetchNotifications],
  );

  const handleRejectReturn = useCallback(
    async (notification) => {
      const { investmentId, returnId } = notification.data || {};
      if (!investmentId || !returnId) return;

      Alert.alert(
        'Reject Return',
        'What should happen next?',
        [
          {
            text: 'Remind Next Time',
            onPress: async () => {
              setProcessingIds(prev => ({ ...prev, [notification._id]: true }));
              try {
                await rejectReturnApi(investmentId, returnId, 'remind_next');
                await markAsRead(notification._id);
                fetchNotifications({ page: 1 });
              } catch (e) {
                Alert.alert('Error', e?.message || 'Failed to reject return');
              } finally {
                setProcessingIds(prev => ({ ...prev, [notification._id]: false }));
              }
            },
          },
          {
            text: 'Stop Recurring Profit',
            style: 'destructive',
            onPress: async () => {
              setProcessingIds(prev => ({ ...prev, [notification._id]: true }));
              try {
                await rejectReturnApi(investmentId, returnId, 'stopped');
                await markAsRead(notification._id);
                fetchNotifications({ page: 1 });
              } catch (e) {
                Alert.alert('Error', e?.message || 'Failed to reject return');
              } finally {
                setProcessingIds(prev => ({ ...prev, [notification._id]: false }));
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    },
    [markAsRead, fetchNotifications],
  );

  const handleLoadMore = useCallback(() => {
    if (pagination?.hasNextPage && !loading && !loadingMore) {
      fetchNotifications({ page: pagination.page + 1 });
    }
  }, [pagination, loading, loadingMore, fetchNotifications]);

  const renderItem = useCallback(
    ({ item }) => (
      <NotificationItem
        item={item}
        onPress={() => handleNotificationPress(item)}
        onApprove={handleApproveReturn}
        onReject={handleRejectReturn}
        loading={processingIds[item._id]}
        s={styles}
      />
    ),
    [handleNotificationPress, handleApproveReturn, handleRejectReturn, processingIds, styles],
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <ActivityIndicator
        size="small"
        color={theme.primary}
        style={styles.loadingMore}
      />
    );
  }, [loadingMore, theme, styles]);

  const hasUnread = notifications.some(n => !n.read);

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Notifications"
        onBack={() => navigation.goBack()}
        backIcon="arrow"
        rightElement={
          hasUnread ? (
            <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
              <CheckCheck
                size={wp(5.5)}
                color={theme.primary}
                strokeWidth={2}
              />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {notifications.length === 0 && loading ? (
        <SkeletonSection itemCount={6} showHeader={false} />
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Bell size={wp(12)} color={theme.textMuted} strokeWidth={1.5} />
          <Label
            type="bodySmall"
            weight="regular"
            color="textMuted"
            style={styles.emptyText}
          >
            No notifications yet
          </Label>
        </View>
      ) : (
        <FlashList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          estimatedItemSize={hp(9)}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    listContent: { paddingBottom: hp(12) },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: wp(3),
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      borderBottomWidth: 0.5,
      borderBottomColor: t.outlineVariant,
    },
    itemUnread: { backgroundColor: t.surfaceSecondary },
    iconWrap: {
      width: wp(10),
      height: wp(10),
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemContent: { flex: 1, gap: hp(0.3) },
    message: { lineHeight: hp(2) },
    dot: {
      width: wp(2),
      height: wp(2),
      borderRadius: wp(1),
      marginTop: hp(0.8),
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: hp(2),
    },
    emptyText: { textAlign: 'center', paddingHorizontal: wp(10) },
    loadingMore: { paddingVertical: hp(2) },
  });

export default NotificationScreen;
