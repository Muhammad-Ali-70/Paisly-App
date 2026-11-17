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
      // 'system' follows the phone; 'light' / 'dark' are the user's override.
      // The resolved light/dark value comes from useResolvedTheme().
      themeMode: 'system',
      setThemeMode: themeMode => set({ themeMode }),
    }),

    {
      name: 'paisly-app-store',
      // v0 saved a fixed 'light'/'dark' copied from the phone on first launch,
      // so it never followed the phone again. Drop it and default to 'system'.
      version: 1,
      migrate: persisted => {
        const { theme, ...rest } = persisted || {};
        return { ...rest, themeMode: 'system' };
      },
      storage: createJSONStorage(() => mmkvStorage),
      partialize: state => ({
        currency: state.currency,
        themeMode: state.themeMode,
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
