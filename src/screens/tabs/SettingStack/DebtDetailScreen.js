import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label } from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import { SkeletonPulse, SkeletonBox } from '../../../components/common/skeleton/Skeleton';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import {
  useDebt,
  useDebtTransactions,
  useDeleteDebt,
} from '../../../queries/debts';
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus';
import { formatDate } from '../../../utils/date';
import ThemedView from '../../../components/ui/ThemedView';

const DebtDetailScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const debtQuery = useDebt(id);
  const transactionsQuery = useDebtTransactions(id);
  const deleteDebt = useDeleteDebt();
  // Refresh after returning from the edit screen
  useRefreshOnFocus(['debts', 'detail', id]);

  const debt = debtQuery.data;
  const debtTransactions = transactionsQuery.data ?? [];
  const loading = debtQuery.isPending;
  const deleting = deleteDebt.isPending;

  const loadError = debtQuery.isError && !debt;
  useEffect(() => {
    if (!loadError) return;
    console.error('Failed to fetch debt details:', debtQuery.error);
    Alert.alert('Error', 'Failed to load debt details. Please try again.');
    navigation.goBack();
  }, [loadError, debtQuery.error, navigation]);

  const handleDeleteDebt = () => {
    Alert.alert('Delete Debt', 'Are you sure you want to delete this debt? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteDebt.mutate(id, {
            onSuccess: () => {
              Alert.alert('Success', 'Debt deleted successfully.');
              navigation.goBack();
            },
            onError: err => {
              console.error('Failed to delete debt:', err);
              Alert.alert('Error', 'Failed to delete debt. Please try again.');
            },
          }),

      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Debt Details" onBack={() => navigation.goBack()} />
        <SkeletonPulse style={styles.scrollContent}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={styles.detailCard}>
              <SkeletonBox width={wp(30)} height={hp(1.6)} />
              <SkeletonBox width={wp(55)} height={hp(2)} style={styles.detailValue} />
            </View>
          ))}
        </SkeletonPulse>
      </View>
    );
  }

  if (!debt) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Debt Details" onBack={() => navigation.goBack()} />
        <View style={styles.emptyWrap}>
          <Label type="bodySmall" color="textMuted">
            Debt not found.
          </Label>
          <PrimaryButton
            variant="primary"
            size="sm"
            label="Go Back"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.safe}>
      <ScreenHeader
        title="Debt Details"
        onBack={() => navigation.goBack()}
        rightElement={
          <View style={styles.headerActions}>
            <PrimaryButton
              variant="ghost"
              size="sm"
              leftIcon={<Pencil size={wp(5)} color={theme.textMain} />}
              onPress={() => navigation.navigate('AddEditDebtScreen', { debtId: id })}
              style={styles.actionButton}
            />
            <PrimaryButton
              variant="dangerOutline"
              size="sm"
              leftIcon={<Trash2 size={wp(5)} color={theme.error} />}
              onPress={handleDeleteDebt}
              loading={deleting}
              style={styles.actionButton}
            />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {debt.sourceAccountId && (
          <View style={styles.detailCard}>
            <Label type="bodySmall" weight="semiBold" color="textMuted">Source Account</Label>
            <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>
              {debt.sourceAccountId.label || 'N/A'}
            </Label>
          </View>
        )}
        <View style={styles.detailCard}>
          <Label type="bodySmall" weight="semiBold" color="textMuted">Description</Label>
          <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{debt.description || 'N/A'}</Label>
        </View>
        <View style={styles.detailCard}>
          <Label type="bodySmall" weight="semiBold" color="textMuted">Total Amount</Label>
          <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>PKR {debt.totalAmount?.toLocaleString()}</Label>
        </View>
        <View style={styles.detailCard}>
          <Label type="bodySmall" weight="semiBold" color="textMuted">Counterparty Name</Label>
          <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{debt.counterpartyName}</Label>
        </View>
        <View style={styles.detailCard}>
          <Label type="bodySmall" weight="semiBold" color="textMuted">Counterparty Email</Label>
          <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{debt.counterpartyEmail || 'N/A'}</Label>
        </View>
        <View style={styles.detailCard}>
          <Label type="bodySmall" weight="semiBold" color="textMuted">Start Date</Label>
          <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{formatDate(debt.startDate)}</Label>
        </View>
        <View style={styles.detailCard}>
          <Label type="bodySmall" weight="semiBold" color="textMuted">Due Date</Label>
          <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{formatDate(debt.dueDate)}</Label>
        </View>
        {debt.interestRate > 0 && (
          <View style={styles.detailCard}>
            <Label type="bodySmall" weight="semiBold" color="textMuted">Interest Rate</Label>
            <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{debt.interestRate}% ({debt.interestType})</Label>
          </View>
        )}
        {!!debt.category && (
          <View style={styles.detailCard}>
            <Label type="bodySmall" weight="semiBold" color="textMuted">Category</Label>
            <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{debt.category}</Label>
          </View>
        )}
        {!!debt.notes && (
          <View style={styles.detailCard}>
            <Label type="bodySmall" weight="semiBold" color="textMuted">Notes</Label>
            <Label type="body" weight="regular" color="textMain" style={styles.detailValue}>{debt.notes}</Label>
          </View>
        )}

        {debtTransactions.length > 0 && (
          <>
            <Label type="bodyMedium" weight="bold" color="textMain" style={styles.sectionTitle}>
              Transaction History
            </Label>
            {debtTransactions.map(txn => (
              <View key={txn._id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View style={styles.transactionInfo}>
                    <Label type="bodySmall" weight="semiBold" color="textMain">
                      {txn.description || txn.category}
                    </Label>
                    <Label type="bodyXs" weight="regular" color="textMuted">
                      {formatDate(txn.date)} • {txn.accountId?.label}
                    </Label>
                  </View>
                  <Label
                    type="bodySmall"
                    weight="semiBold"
                    color={txn.type === 'expense' ? 'error' : 'primary'}
                  >
                    {txn.type === 'expense' ? '-' : '+'}PKR {txn.amount?.toLocaleString()}
                  </Label>
                </View>
              </View>
            ))}
          </>
        )}

        {transactionsQuery.isPending && (
          <SkeletonPulse style={styles.loadingTransactions}>
            <SkeletonBox width="100%" height={hp(7)} radius={12} />
          </SkeletonPulse>
        )}
      </ScrollView>
    </ThemedView>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: hp(1.5),
    },
    scrollContent: {
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
    },
    detailCard: {
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      padding: wp(4),
      marginBottom: hp(1.5),
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    detailValue: {
      marginTop: hp(0.5),
    },
    headerActions: {
      flexDirection: 'row',
      gap: wp(2),
    },
    actionButton: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        paddingHorizontal: 0,
    },
    sectionTitle: {
      marginTop: hp(2),
      marginBottom: hp(1),
    },
    transactionCard: {
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      padding: wp(4),
      marginBottom: hp(1),
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    transactionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    transactionInfo: {
      flex: 1,
      gap: hp(0.3),
    },
    loadingTransactions: {
      paddingVertical: hp(1),
    },
  });

export default DebtDetailScreen;
