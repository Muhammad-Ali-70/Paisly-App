import { Appearance } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../services/storage';

// Settings that belong to the signed-in user, not the device. Logout resets
// them so the next person on the same phone doesn't inherit someone else's
// payday, reminders or defaults. (Theme is a device preference and stays.)
const userDefaults = () => ({
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  activeFilter: 'all',
  currency: 'PKR',
  investmentDefaults: {
    profitEnabled: true,
    profitType: 'fixed',
    profitValue: '0',
    frequency: 'monthly',
    returnDay: null,
  },
  reminders: {
    dailyEnabled: false,
    dailyHour: 20,
    dailyMinute: 0,
    debtEnabled: false,
    billEnabled: false,
    lastLoggedDay: null,
  },
  paydayDay: null,
  paydaySet: false,
  checklistDismissed: false,
});

const useAppStore = create(
  persist(
    set => ({
      ...userDefaults(),

      /** Called on logout. */
      resetUserData: () => set(userDefaults()),

      // ── UI / Filters ────────────────────────────────────────────────────────
      setSelectedMonth: (month, year) =>
        set({ selectedMonth: month, selectedYear: year }),

      setActiveFilter: filter => set({ activeFilter: filter }),

      setCurrency: currency => set({ currency }),

      // ── Investment Defaults ─────────────────────────────────────────────────
      setInvestmentDefaults: defaults =>
        set(state => ({
          investmentDefaults: { ...state.investmentDefaults, ...defaults },
        })),

      // ── Local reminders ─────────────────────────────────────────────────────
      // lastLoggedDay lets the daily reminder skip a day the user already logged
      setReminders: patch =>
        set(state => ({ reminders: { ...state.reminders, ...patch } })),

      // ── Payday ──────────────────────────────────────────────────────────────
      // paydayDay: day of month money arrives; null means "treat the month's
      // end as payday". paydaySet tells choosing "month end" on purpose (also
      // null) apart from never having chosen one.
      setPaydayDay: day => set({ paydayDay: day, paydaySet: true }),

      // ── Home getting-started checklist ─────────────────────────────────────
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
        currency: state.currency,
        theme: state.theme,
        investmentDefaults: state.investmentDefaults,
        reminders: state.reminders,
        paydayDay: state.paydayDay,
        paydaySet: state.paydaySet,
        checklistDismissed: state.checklistDismissed,
      }),
    },
  ),
);

// ── Selectors (use these everywhere instead of raw state) ──────────────────

/** True once the user has chosen a payday (a day, or month end on purpose). */
export const selectHasPayday = state =>
  state.paydaySet || state.paydayDay != null;

export default useAppStore;
