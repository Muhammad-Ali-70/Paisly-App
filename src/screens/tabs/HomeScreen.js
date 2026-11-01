import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';

import HomeHeader from '../../components/home/HomeHeader';
import BalanceSummaryCard from '../../components/home/BalanceSummaryCard';
import AccountBreakdownRow from '../../components/home/AccountBreakdownRow';
import DebtSummaryCard from '../../components/home/DebtSummaryCard';
import MonthlySpendingCard from '../../components/home/MonthlySpendingCard';
import SmartInsightCard from '../../components/home/SmartInsightCard';
import RecentActivitySection from '../../components/home/RecentActivitySection';
import GettingStartedCard from '../../components/home/GettingStartedCard';

import useAccountStore from '../../store/useAccountStore';
import useCategoryStore from '../../store/useCategoryStore';
import useTransactionStore, {
  mergeOverlay,
  RECENT_LIMIT,
} from '../../store/useTransactionStore';
import { groupTransactions } from '../../utils/transactionUtils';
import HomeSkeleton from '../../components/home/HomeSkeleton';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { Label } from '../../constants/globalstyle';

const HomeScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accounts = useAccountStore(s => s.accounts);
  const fetchAccounts = useAccountStore(s => s.fetchAccounts);
  const categories = useCategoryStore(s => s.categories);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);

  // Cached (persisted) dashboard: shown instantly, refreshed in the background
  const dashboard = useTransactionStore(s => s.dashboard);
  const debtSummary = useTransactionStore(s => s.debtSummary);
  const loadError = useTransactionStore(s => s.dashboardError);
  const overlay = useTransactionStore(s => s.overlay);
  const fetchDashboard = useTransactionStore(s => s.fetchDashboard);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Just-added transactions appear before the server round-trip completes
  const recentTransactions = useMemo(() => {
    const merged = mergeOverlay(
      dashboard?.recentTransactions ?? [],
      overlay,
    ).slice(0, RECENT_LIMIT);
    return groupTransactions(merged).flatMap(g => g.transactions);
  }, [dashboard, overlay]);

  const totalExpenses = useMemo(() => {
    const pendingThisMonth = overlay
      .filter(t => {
        const d = new Date(t.date);
        return (
          t.pending &&
          t.type === 'expense' &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return (dashboard?.totalExpenses ?? 0) + pendingThisMonth;
  }, [dashboard, overlay, month, year]);

  const dailySpending = dashboard?.dailySpending ?? [];
  const budget = dashboard?.budget ?? null;

  const activity = useTransactionStore(s => s.activity);
  const checklistDismissed = useTransactionStore(s => s.checklistDismissed);
  const dismissChecklist = useTransactionStore(s => s.dismissChecklist);

  const addTransaction = useCallback(
    type => navigation.navigate('AddTransaction', { type }),
    [navigation],
  );

  // Until the user has logged anything, guide them instead of showing a
  // zeroed chart, an empty debt card and an empty activity list.
  const activityKnown = activity.expense !== null && activity.income !== null;
  const isNewUser =
    activityKnown &&
    !activity.expense &&
    !activity.income &&
    recentTransactions.length === 0;

  const checklistSteps = [
    { key: 'accounts', title: 'Set up your accounts', done: true },
    {
      key: 'expense',
      title: 'Log your first expense',
      subtitle: 'Coffee, groceries, a ride — anything you paid for today.',
      done: !!activity.expense,
      onPress: () => addTransaction('expense'),
    },
    {
      key: 'income',
      title: 'Record your income',
      subtitle: 'Salary or any money you received this month.',
      done: !!activity.income,
      onPress: () => addTransaction('income'),
    },
    {
      key: 'budget',
      title: 'Set a monthly budget',
      subtitle: 'Get warned before you overspend.',
      done: !!budget,
      // initial: false keeps PlanScreen beneath EditBudget so back works
      onPress: () =>
        navigation.navigate('Plan', { screen: 'EditBudget', initial: false }),
    },
  ];
  const showChecklist =
    activityKnown && !checklistDismissed && checklistSteps.some(s => !s.done);
  const hasDebts =
    debtSummary.totalOutstanding > 0 || debtSummary.totalReceivable > 0;

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts();
  }, [accounts.length, fetchAccounts]);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [categories.length, fetchCategories]);

  // Runs on mount too (first focus), so no separate mount effect is needed
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), fetchDashboard()]);
    setRefreshing(false);
  }, [fetchAccounts, fetchDashboard]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  // Show a retry screen instead of silently rendering an all-zero dashboard
  // (only when there is no cached dashboard to fall back on)
  if (!dashboard && loadError) {
    return (
      <View style={styles.safe}>
        <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />
        <View style={styles.errorWrap}>
          <Label type="h3" weight="semiBold" color="textMain" style={styles.errorTitle}>
            Couldn't load your dashboard
          </Label>
          <Label type="bodySmall" weight="regular" color="textMuted" style={styles.errorSubtitle}>
            {loadError}
          </Label>
          <PrimaryButton
            variant="primary"
            size="md"
            label="Try Again"
            onPress={() => {
              useTransactionStore.setState({ dashboardError: null });
              fetchDashboard();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />

        {!dashboard ? (
          <HomeSkeleton />
        ) : (
          <>
            <BalanceSummaryCard
              totalBalance={totalBalance}
              monthlyChange={`-PKR ${totalExpenses.toLocaleString()}`}
            />

            <AccountBreakdownRow accounts={accounts} />

            {showChecklist && (
              <GettingStartedCard
                steps={checklistSteps}
                onDismiss={dismissChecklist}
              />
            )}

            {(!isNewUser || hasDebts) && (
              <DebtSummaryCard
                outstandingTotal={debtSummary.totalOutstanding}
                receivableTotal={debtSummary.totalReceivable}
                onPress={() => navigation.navigate('User', {
                  screen: 'DebtScreen',
                  initial: false,
                })}
              />
            )}

            {!isNewUser && (
              <MonthlySpendingCard
                spendingAmount={totalExpenses}
                dailySpending={dailySpending}
                budgetPercent={budget?.percentUsed ?? 0}
                remainingAmount={budget?.remaining}
                budgetStatus={budget?.status}
                remainingLabel={budget ? undefined : "Set a budget in Plan tab"}
              />
            )}

            {!isNewUser && !showChecklist && (
              <SmartInsightCard message="Tap any account card to see its breakdown." />
            )}

            {!isNewUser && (
              <RecentActivitySection
                transactions={recentTransactions}
                onSeeAll={() => navigation?.navigate('History')}
                onAddPress={() => addTransaction('expense')}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    flex: { flex: 1 },
    scrollContent: {
      paddingBottom: hp(12),
    },
    errorWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorTitle: {
      textAlign: 'center',
      marginBottom: hp(0.5),
    },
    errorSubtitle: {
      textAlign: 'center',
      marginBottom: hp(2),
      paddingHorizontal: wp(10),
    },
  });

export default HomeScreen;
