import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../../constants/responsive';
import { Label, borderRadius } from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import useAppStore from '../../../store/useAppStore';
import {
  openNotificationSettings,
  requestReminderPermission,
} from '../../../services/remindersService';

export const formatReminderTime = (hour, minute) => {
  const at = new Date();
  at.setHours(hour, minute, 0, 0);
  return at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const RemindersScreen = () => {
  const theme = useThemeColors();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reminders = useAppStore(s => s.reminders);
  const setReminders = useAppStore(s => s.setReminders);
  const [pickingTime, setPickingTime] = useState(false);

  // Turning a reminder on is the moment to ask for the notification permission
  const toggle = async (key, value) => {
    if (value && !(await requestReminderPermission())) {
      Alert.alert(
        'Notifications are off',
        'Allow notifications for Paisly in your phone settings to get reminders.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: openNotificationSettings },
        ],
      );
      return;
    }
    setReminders({ [key]: value });
  };

  const onTimePicked = (_event, selected) => {
    setPickingTime(false);
    setReminders({
      dailyHour: selected.getHours(),
      dailyMinute: selected.getMinutes(),
    });
  };

  const pickerValue = new Date();
  pickerValue.setHours(reminders.dailyHour, reminders.dailyMinute, 0, 0);

  const switchProps = value => ({
    value,
    trackColor: { false: theme.outlineVariant, true: theme.primaryContainer },
    thumbColor: value ? theme.primary : theme.surfacePrimary,
  });

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Reminders"
        onBack={() => navigation.goBack()}
        backIcon="arrow"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Label type="bodySmall" weight="semiBold" color="textMain">
                Daily reminder
              </Label>
              <Label type="bodyXs" weight="regular" color="textMuted">
                A nudge to log your spending. Skipped on days you've already
                added something.
              </Label>
            </View>
            <Switch
              {...switchProps(reminders.dailyEnabled)}
              onValueChange={v => toggle('dailyEnabled', v)}
            />
          </View>

          {reminders.dailyEnabled ? (
            <TouchableOpacity
              style={[styles.row, styles.timeRow]}
              activeOpacity={0.7}
              onPress={() => setPickingTime(true)}
            >
              <Label type="bodySmall" weight="semiBold" color="textMain">
                Reminder time
              </Label>
              <Label type="bodySmall" weight="semiBold" color="primary">
                {formatReminderTime(reminders.dailyHour, reminders.dailyMinute)}
              </Label>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Label type="bodySmall" weight="semiBold" color="textMain">
                Debt reminders
              </Label>
              <Label type="bodyXs" weight="regular" color="textMuted">
                Before money you owe, or are owed, falls due and on the day
                itself.
              </Label>
            </View>
            <Switch
              {...switchProps(reminders.debtEnabled)}
              onValueChange={v => toggle('debtEnabled', v)}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Label type="bodySmall" weight="semiBold" color="textMain">
                Bill reminders
              </Label>
              <Label type="bodyXs" weight="regular" color="textMuted">
                Rent, utilities and other recurring bills, a couple of days
                before and on the day.
              </Label>
            </View>
            <Switch
              {...switchProps(reminders.billEnabled)}
              onValueChange={v => toggle('billEnabled', v)}
            />
          </View>
        </View>
      </ScrollView>

      {pickingTime ? (
        <DateTimePicker
          mode="time"
          value={pickerValue}
          onValueChange={onTimePicked}
          onDismiss={() => setPickingTime(false)}
        />
      ) : null}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    scrollContent: {
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      paddingBottom: hp(12),
      gap: hp(2),
    },
    card: {
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.8),
      gap: wp(3),
    },
    rowText: { flex: 1, gap: hp(0.3) },
    timeRow: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.outlineVariant,
    },
  });

export default RemindersScreen;
