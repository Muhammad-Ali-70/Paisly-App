import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Pencil } from 'lucide-react-native';
import HomeHeader from '../../../components/home/HomeHeader';
import TotalSpendingCard from '../../../components/totalspending/TotalSpendingCard';
import CategoryBreakdownItem from '../../../components/totalspending/CategoryBreakdownItem';
import SmartInsightCard from '../../../components/home/SmartInsightCard';
import { useThemeColors } from '@hooks/useThemeColors';
import { borderRadius, Label } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import { useCurrentBudget } from '../../../queries/budget';
import { queryKeys } from '../../../queries/keys';
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus';
import {
  SkeletonPulse,
  SkeletonBox,
} from '../../../components/common/skeleton/Skeleton';
import PrimaryButton from '../../../components/ui/PrimaryButton';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const generateInsight = (spending) => {
  if (!spending) return null;
  const highest = spending.byCategory?.reduce((max, cat) => cat.percentUsed > (max?.percentUsed || 0) ? cat : max, null);
  const lowest = spending.byCategory?.reduce((min, cat) => cat.percentUsed < (min?.percentUsed || 100) ? cat : min, null);

  if (highest && highest.status === 'over') {
    return `You're spending over budget on ${highest.label}. Consider reallocating from other categories.`;
  }
  if (highest && highest.percentUsed >= 80) {
    return `You've used ${Math.round(highest.percentUsed)}% of your ${highest.label} budget. You're close to the limit.`;
  }
  if (lowest && lowest.percentUsed < 30 && lowest.limit) {
    return `Great job keeping ${lowest.label} spending low! You've only used ${Math.round(lowest.percentUsed)}% of the budget.`;
  }
  return `You've used ${Math.round(spending.percentUsed || 0)}% of your monthly budget. ${spending.remaining > 0 ? `You have ${Math.round(spending.remaining).toLocaleString()} PKR remaining.` : ''}`;
};

const PlanScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Cached budget shows instantly; it refetches in the background when stale
  const { data: currentBudget, isPending, error, refetch } = useCurrentBudget();
  useRefreshOnFocus(queryKeys.budget);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const now = new Date();
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const spending = currentBudget?.spending;
  const budget = currentBudget?.budget;

  const insight = useMemo(() => generateInsight(spending), [spending]);

  const handleEditBudget = useCallback(() => {
    navigation.navigate('EditBudget');
  }, [navigation]);

  const handleCategoryDetails = useCallback((category) => {
    navigation.navigate('CategoryDetail', { category });
  }, [navigation]);

  if (isPending) {
    return (
      <View style={styles.safe}>
        <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />
        <SkeletonPulse style={styles.skeleton}>
          <View style={styles.skeletonHeader}>
            <SkeletonBox width={wp(40)} height={hp(2.6)} />
            <SkeletonBox width={wp(26)} height={hp(4)} radius={borderRadius.full} />
          </View>
          <SkeletonBox width="100%" height={hp(20)} radius={borderRadius.xl} />
          {[0, 1, 2, 3].map(i => (
            <SkeletonBox key={i} width="100%" height={hp(8)} radius={borderRadius.lg} />
          ))}
        </SkeletonPulse>
      </View>
    );
  }

  // Errors only replace the screen when there is no cached budget to show
  if (!currentBudget && error) {
    return (
      <View style={styles.safe}>
        <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />
        <View style={styles.emptyContent}>
          <Label type="bodySmall" weight="regular" color="textMuted" style={styles.emptyText}>
            {error.message || 'Could not load your budget.'}
          </Label>
          <PrimaryButton
            variant="primary"
            size="lg"
            label="Try Again"
            onPress={() => refetch()}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={styles.safe}>
        <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />
        <View style={styles.emptyContent}>
          <Label type="bodySmall" weight="regular" color="textMuted" style={styles.emptyText}>
            No budget set for current month
          </Label>
          <PrimaryButton
            variant="primary"
            size="lg"
            label="Set Up Budget"
            onPress={handleEditBudget}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.monthRow}>
          <View>
            <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.monthLabel}>
              MONTHLY BUDGET
            </Label>
            <Label type="headingMedium" weight="bold" color="textMain">
              {monthLabel}
            </Label>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handleEditBudget} activeOpacity={0.75}>
            <Pencil size={wp(3.8)} color={theme.primary} strokeWidth={2} />
            <Label type="bodyXs" weight="semiBold" color="primary">
              Edit Budget
            </Label>
          </TouchableOpacity>
        </View>

        <TotalSpendingCard
          spentAmount={spending.total}
          limitAmount={budget.totalLimit}
          remainingAmount={spending.remaining}
          dailyAverage={spending.dailyAverage}
          percentUsed={spending.percentUsed}
        />

        <View style={styles.breakdownSection}>
          <View style={styles.breakdownHeader}>
            <Label type="headingXs" weight="bold" color="textMain">
              Category Breakdown
            </Label>
          </View>
          <View style={styles.list}>
            {spending.byCategory.map((cat) => (
              <TouchableOpacity
                key={cat.category}
                activeOpacity={0.7}
                onPress={() => handleCategoryDetails(cat.category)}
              >
                <CategoryBreakdownItem
                  iconName={cat.iconName}
                  iconBg={cat.iconBg}
                  iconColor={cat.iconColor}
                  label={cat.label}
                  spentAmount={cat.spent}
                  limitAmount={cat.limit || cat.spent}
                  barColor={cat.status === 'over' ? theme.error : cat.status === 'warning' ? '#F59E0B' : theme.primary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {insight && <SmartInsightCard message={insight} />}
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
    skeleton: {
      paddingHorizontal: wp(5),
      gap: hp(1.5),
    },
    skeletonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(0.5),
    },
    scrollContent: {
      paddingBottom: hp(12),
    },
    monthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      marginBottom: hp(2),
    },
    monthLabel: {
      letterSpacing: 0.8,
      marginBottom: hp(0.3),
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
      borderWidth: 1,
      borderColor: t.primary,
      borderRadius: borderRadius.full,
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(0.9),
    },
    breakdownSection: {
      marginHorizontal: wp(5),
      marginTop: hp(3),
      gap: hp(1.5),
    },
    breakdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    list: {
      gap: hp(1.2),
    },
    emptyContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      textAlign: 'center',
      marginBottom: hp(2),
      paddingHorizontal: wp(10),
    },
    emptyButton: {
      width: wp(70),
      alignSelf: 'center',
    },
  });

export default PlanScreen;
