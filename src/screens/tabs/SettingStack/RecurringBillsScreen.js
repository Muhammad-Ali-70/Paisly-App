import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../../constants/responsive';
import { Label, borderRadius, shadowCard } from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import BillRow from '../../../components/recurring/BillRow';
import { useRecurring } from '../../../queries/recurring';
import usePayBill from '../../../hooks/usePayBill';
import useAppStore from '../../../store/useAppStore';

const RecurringBillsScreen = () => {
  const theme = useThemeColors();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: bills = [], isPending, isRefetching, refetch } = useRecurring();
  const { confirmPaid, confirmSkip, busy } = usePayBill();
  const billReminders = useAppStore(s => s.reminders.billEnabled);

  const openEditor = bill =>
    navigation.navigate('AddEditBill', bill ? { billId: bill._id } : undefined);

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Recurring Bills"
        onBack={() => navigation.goBack()}
        backIcon="arrow"
        rightElement={
          <TouchableOpacity onPress={() => openEditor()} activeOpacity={0.7}>
            <Plus size={wp(6)} color={theme.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isPending} onRefresh={refetch} />
        }
      >
        {bills.length > 0 && !billReminders ? (
          <TouchableOpacity
            style={styles.hint}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Reminders')}
          >
            <Label type="bodyXs" weight="semiBold" color="primary">
              Get a reminder before each bill is due → Turn on
            </Label>
          </TouchableOpacity>
        ) : null}

        {bills.length === 0 ? (
          <View style={styles.empty}>
            <Label type="bodyMedium" weight="semiBold" color="textMain">
              {isPending ? 'Loading…' : 'No recurring bills yet'}
            </Label>
            {!isPending ? (
              <Label
                type="bodySmall"
                weight="regular"
                color="textMuted"
                style={styles.emptyText}
              >
                Add rent, electricity, a fee or your salary. You’ll get a
                reminder and mark it paid in one tap.
              </Label>
            ) : null}
          </View>
        ) : (
          <View style={[styles.card, shadowCard]}>
            {bills.map((bill, index) => (
              <View
                key={bill._id}
                style={index > 0 ? styles.divided : undefined}
              >
                <BillRow
                  bill={bill}
                  onPress={() => openEditor(bill)}
                  onPaid={() => confirmPaid(bill)}
                  onSkip={() => confirmSkip(bill)}
                  disabled={busy}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          variant="primary"
          size="lg"
          label="Add recurring bill"
          leftIcon={<Plus size={wp(5)} color={theme.onPrimary} />}
          onPress={() => openEditor()}
        />
      </View>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    scrollContent: {
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      paddingBottom: hp(14),
      gap: hp(2),
    },
    card: {
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
    },
    divided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.outlineVariant,
    },
    hint: {
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.lg,
      padding: wp(3.5),
    },
    empty: { alignItems: 'center', paddingTop: hp(8), gap: hp(1) },
    emptyText: { textAlign: 'center', paddingHorizontal: wp(6) },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      backgroundColor: t.background,
    },
  });

export default RecurringBillsScreen;
