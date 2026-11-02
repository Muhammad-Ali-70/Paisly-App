import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
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
import AddExpenseFab from '../../components/home/AddExpenseFab';
import SafeToSpendCard from '../../components/home/SafeToSpendCard';
import BillsDueCard from '../../components/home/BillsDueCard';
import PaydayModal from '../../components/modals/PaydayModal';
import useSafeToSpend from '../../hooks/useSafeToSpend';
import { useRecurring } from '../../queries/recurring';
import { billsDueSoon } from '../../utils/recurring';

import useAccountStore from '../../store/useAccountStore';
import useCategoryStore from '../../store/useCategoryStore';
import useAppStore from '../../store/useAppStore';
import { useActivity, useDashboard } from '../../queries/transactions';
import { useDebtSummary } from '../../queries/debts';
import { useRefreshOnFocus } from '@hooks/useRefreshOnFocus';
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

  // Persisted queries: cached data shows instantly, refetched in the background.
  // Just-added transactions are written into this cache optimistically.
  const dashboardQuery = useDashboard();
  const debtQuery = useDebtSummary();
  const activityQuery = useActivity();
  useRefreshOnFocus(['dashboard']);
  useRefreshOnFocus(['debts', 'summary']);
  const [refreshing, setRefreshing] = useState(false);

  // FAB shrinks to an icon while scrolling down, expands when scrolling up/at top
  const [fabCollapsed, setFabCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const handleScroll = useCallback(e => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastScrollY.current;
    if (y < 40) setFabCollapsed(false);
    else if (delta > 6) setFabCollapsed(true);
    else if (delta < -6) setFabCollapsed(false);
    lastScrollY.current = y;
  }, []);

  const safeToSpend = useSafeToSpend();
  const { data: recurringBills } = useRecurring();
  const dueBills = useMemo(() => billsDueSoon(recurringBills), [recurringBills]);
  const paydayDay = useAppStore(s => s.paydayDay);
  const setPaydayDay = useAppStore(s => s.setPaydayDay);
  const [paydayVisible, setPaydayVisible] = useState(false);

  const dashboard = dashboardQuery.data;
  const debtSummary = debtQuery.data ?? {
    totalOutstanding: 0,
    totalReceivable: 0,
  };

  const recentTransactions = useMemo(
    () =>
      groupTransactions(dashboard?.recentTransactions ?? []).flatMap(
        g => g.transactions,
      ),
    [dashboard],
  );

  const totalExpenses = dashboard?.totalExpenses ?? 0;
  const dailySpending = dashboard?.dailySpending ?? [];
  const budget = dashboard?.budget ?? null;

  // This month's data also counts, in case the probe ran before a save
  const recentTypes = new Set(
    (dashboard?.recentTransactions ?? []).map(t => t.type),
  );
  const activity = activityQuery.data && {
    expense: activityQuery.data.expense || recentTypes.has('expense'),
    income: activityQuery.data.income || recentTypes.has('income'),
  };
  const reminders = useAppStore(s => s.reminders);
  const remindersOn =
    reminders.dailyEnabled || reminders.debtEnabled || reminders.billEnabled;
  const checklistDismissed = useAppStore(s => s.checklistDismissed);
  const dismissChecklist = useAppStore(s => s.dismissChecklist);

  const addTransaction = useCallback(
    type => navigation.navigate('AddTransaction', { type }),
    [navigation],
  );

  // Until the user has logged anything, guide them instead of showing a
  // zeroed chart, an empty debt card and an empty activity list.
  const activityKnown = !!activity;
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
      done: !!activity?.expense,
      onPress: () => addTransaction('expense'),
    },
    {
      key: 'income',
      title: 'Record your income',
      subtitle: 'Salary or any money you received this month.',
      done: !!activity?.income,
      onPress: () => addTransaction('income'),
    },
    {
      key: 'reminders',
      title: 'Set up reminders',
      subtitle: 'A nudge to log spending, and alerts before bills and debts are due.',
      done: remindersOn,
      // initial: false keeps Settings beneath Reminders so back works
      onPress: () =>
        navigation.navigate('User', { screen: 'Reminders', initial: false }),
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

  const { refetch: refetchDashboard } = dashboardQuery;
  const { refetch: refetchDebts } = debtQuery;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), refetchDashboard(), refetchDebts()]);
    setRefreshing(false);
  }, [fetchAccounts, refetchDashboard, refetchDebts]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  // Show a retry screen instead of silently rendering an all-zero dashboard
  // (only when there is no cached dashboard to fall back on)
  if (!dashboard && dashboardQuery.isError) {
    return (
      <View style={styles.safe}>
        <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />
        <View style={styles.errorWrap}>
          <Label type="h3" weight="semiBold" color="textMain" style={styles.errorTitle}>
            Couldn't load your dashboard
          </Label>
          <Label type="bodySmall" weight="regular" color="textMuted" style={styles.errorSubtitle}>
            {dashboardQuery.error?.message || 'Could not load your dashboard.'}
          </Label>
          <PrimaryButton
            variant="primary"
            size="md"
            label="Try Again"
            loading={dashboardQuery.isFetching}
            onPress={() => refetchDashboard()}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

            {!isNewUser && safeToSpend && (
              <SafeToSpendCard
                result={safeToSpend}
                onPress={() => setPaydayVisible(true)}
              />
            )}

            {!isNewUser && (
              <BillsDueCard
                bills={dueBills}
                onSeeAll={() =>
                  navigation.navigate('User', {
                    screen: 'RecurringBills',
                    initial: false,
                  })
                }
                onOpenBill={bill =>
                  navigation.navigate('User', {
                    screen: 'AddEditBill',
                    params: { billId: bill._id },
                    initial: false,
                  })
                }
              />
            )}

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

      <AddExpenseFab
        collapsed={fabCollapsed}
        onPress={() => addTransaction('expense')}
      />

      <PaydayModal
        visible={paydayVisible}
        onClose={() => setPaydayVisible(false)}
        value={paydayDay}
        onSelect={setPaydayDay}
      />
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
