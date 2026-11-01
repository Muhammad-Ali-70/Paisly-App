import React, { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import useAuthStore, {
  selectToken,
  selectIsOnboarded,
  selectHasSeenCarousel,
} from '../store/useAuthStore';
import useAccountStore from '../store/useAccountStore';
import useCategoryStore from '../store/useCategoryStore';
import { queryClient } from '../services/queryClient';
import { prefetchHomeData } from '../queries/transactions';
import { debtSummaryQuery } from '../queries/debts';
import TabNavigator from './TabNavigator';
import SplashScreen from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import WelcomeCarouselScreen from '../screens/onboarding/WelcomeCarouselScreen';
import AuthStack from './AuthStack';
import AddTransactionScreen from '../screens/tabs/AddTrasaction/AddTransactionScreen';
import BulkAddScreen from '../screens/tabs/AddTrasaction/BulkAddScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { executePendingAction } from '../utils/deepLinkHandler';
import { DEV_CONFIG } from '../config/dev';

const Stack = createNativeStackNavigator();

const PendingActionHandler = ({ pendingAction }) => {
  const navigation = useNavigation();
  const clearPendingAction = useAuthStore(s => s.clearPendingAction);

  // Mounted only inside the signed-in, onboarded tree, so the target routes exist.
  // Waits for the container to be ready rather than guessing a delay.
  useEffect(() => {
    if (!pendingAction || !navigation) return undefined;

    let cancelled = false;
    let retry;
    const run = () => {
      if (cancelled) return;
      if (navigation.isReady && !navigation.isReady()) {
        retry = setTimeout(run, 100);
        return;
      }
      executePendingAction(pendingAction, navigation, clearPendingAction);
    };
    const task = InteractionManager.runAfterInteractions(run);

    return () => {
      cancelled = true;
      clearTimeout(retry);
      task.cancel();
    };
  }, [pendingAction, navigation, clearPendingAction]);

  return null;
};

const RootStackNavigator = ({ pendingAction }) => {
  const [showSplash, setShowSplash] = useState(true);

  const token = useAuthStore(selectToken);
  const isOnboarded = useAuthStore(selectIsOnboarded);
  const hasSeenCarousel = useAuthStore(selectHasSeenCarousel);
  const fetchAccounts = useAccountStore(s => s.fetchAccounts);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (token && isOnboarded) {
      fetchAccounts();
      fetchCategories();
      // Starts during the splash so Home usually mounts with fresh data
      prefetchHomeData(queryClient);
      queryClient.prefetchQuery(debtSummaryQuery);
    }
  }, [token, isOnboarded, fetchAccounts, fetchCategories]);

  if (showSplash) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  const shouldShowCarousel = DEV_CONFIG.FORCE_SHOW_CAROUSEL || (!token && !hasSeenCarousel);

  if (shouldShowCarousel) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WelcomeCarousel" component={WelcomeCarouselScreen} />
      </Stack.Navigator>
    );
  }

  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthStack" component={AuthStack} />
      </Stack.Navigator>
    );
  }

  if (!isOnboarded) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TabNavigator" component={TabNavigator} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="BulkAdd" component={BulkAddScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
      <PendingActionHandler pendingAction={pendingAction} />
    </>
  );
};

export default RootStackNavigator;
