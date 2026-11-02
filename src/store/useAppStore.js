import { Appearance } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../services/storage';

const useAppStore = create(
  persist(
    set => ({
      // ── Onboarding ─ keyed by Supabase user ID ──────────────────────────────
      onboardingByUser: {},

      setOnboardingComplete: userId =>
        set(state => ({
          onboardingByUser: {
            ...state.onboardingByUser,
            [userId]: true,
          },
        })),

      resetOnboardingForUser: userId =>
        set(state => {
          const next = { ...state.onboardingByUser };
          delete next[userId];
          return {
            onboardingByUser: next,
            selectedMonth: new Date().getMonth(),
            selectedYear: new Date().getFullYear(),
            activeFilter: 'all',
          };
        }),

      resetOnboarding: () =>
        set({
          onboardingByUser: {},
          selectedMonth: new Date().getMonth(),
          selectedYear: new Date().getFullYear(),
          activeFilter: 'all',
          currency: 'PKR',
        }),

      // ── UI / Filters ────────────────────────────────────────────────────────
      selectedMonth: new Date().getMonth(),
      selectedYear: new Date().getFullYear(),
      setSelectedMonth: (month, year) =>
        set({ selectedMonth: month, selectedYear: year }),

      activeFilter: 'all',
      setActiveFilter: filter => set({ activeFilter: filter }),

      currency: 'PKR',
      setCurrency: currency => set({ currency }),

      // ── Investment Defaults ─────────────────────────────────────────────────
      investmentDefaults: {
        profitEnabled: true,
        profitType: 'fixed',
        profitValue: '0',
        frequency: 'monthly',
        returnDay: null,
      },
      setInvestmentDefaults: defaults =>
        set(state => ({
          investmentDefaults: { ...state.investmentDefaults, ...defaults },
        })),

      // ── Local reminders ─────────────────────────────────────────────────────
      // lastLoggedDay lets the daily reminder skip a day the user already logged
      reminders: {
        dailyEnabled: false,
        dailyHour: 20,
        dailyMinute: 0,
        debtEnabled: false,
        billEnabled: false,
        lastLoggedDay: null,
      },
      setReminders: patch =>
        set(state => ({ reminders: { ...state.reminders, ...patch } })),

      // ── Payday ──────────────────────────────────────────────────────────────
      // Day of month money arrives; null means "treat the month's end as payday"
      paydayDay: null,
      setPaydayDay: day => set({ paydayDay: day }),

      // ── Home getting-started checklist ─────────────────────────────────────
      checklistDismissed: false,
      dismissChecklist: () => set({ checklistDismissed: true }),

      // ── Theme ───────────────────────────────────────────────────────────────
      // On first launch, read system appearance preference; persist preserves user choice
      theme: Appearance.getColorScheme() || 'light',
      setTheme: theme => set({ theme }),
      toggleTheme: () =>
        set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),

    {
      name: 'paisly-app-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: state => ({
        onboardingByUser: state.onboardingByUser,
        currency: state.currency,
        theme: state.theme,
        investmentDefaults: state.investmentDefaults,
        reminders: state.reminders,
        paydayDay: state.paydayDay,
        checklistDismissed: state.checklistDismissed,
      }),
    },
  ),
);

// ── Selectors (use these everywhere instead of raw state) ──────────────────

/** Returns true only if THIS user has completed onboarding on this device. */
export const selectIsOnboarded = userId => state =>
  userId ? state.onboardingByUser[userId] ?? false : false;

export default useAppStore;
