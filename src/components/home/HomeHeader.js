import React, { useCallback } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label, shadowPrimary } from '../../constants/globalstyle';
import useNotificationStore from '../../store/useNotificationStore';

const HomeHeader = ({ avatarSource, onBellPress }) => {
  const theme = useThemeColors();
  const navigation = useNavigation();
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const fetchUnreadCount = useNotificationStore(s => s.fetchUnreadCount);

  // Refresh on every focus so the badge doesn't go stale between screens
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount]),
  );

  const handleBellPress = () => {
    if (onBellPress) {
      onBellPress();
    } else {
      navigation.navigate('Notifications');
    }
  };

  return (
    <View style={[styles.container, shadowPrimary]}>
      <View style={styles.left}>
        <Label type="body" weight="bold" color="primary">
          Paisly
        </Label>
      </View>

      <TouchableOpacity
        onPress={handleBellPress}
        activeOpacity={0.7}
        style={styles.bell}
      >
        <Bell size={wp(5.5)} color={theme.textMuted} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.error }]}>
            <Label type="caption" weight="bold" color="white" style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Label>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
  bell: {
    padding: wp(1.5),
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(2.25),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 10,
  },
});

export default HomeHeader;
