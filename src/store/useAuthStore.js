import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, mmkvStorage } from '../services/storage';
import { signupApi, loginApi, getMeApi, verifySignupOtpApi, updateProfileApi, uploadAvatarApi, deleteAccountApi } from '../services/authService';
import useAccountStore from './useAccountStore';
import useAppStore from './useAppStore';
import { clearQueryCache } from '../services/queryClient';
import { cancelAllReminders } from '../services/remindersService';

const withLoading = async (set, fn) => {
  set({ isLoading: true, error: null });
  try {
    const result = await fn();
    set({ isLoading: false });
    return result;
  } catch (err) {
    set({ error: err.message, isLoading: false });
    return { success: false, message: err.message };
  }
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      user: null,
      token: null,
      isLoading: false,
      error: null,
      rememberMe: true,
      pendingAction: null,
      hasSeenCarousel: false,
      // True once this device has logged in or verified an account. Decides whether
      // the auth stack opens on Sign Up (new install) or Log In (returning user).
      hasAccount: false,

      // ── Actions ────────────────────────────────────────────────────────────

      signup: ({ name, email, password }) =>
        withLoading(set, async () => {
          const data = await signupApi({ name, email, password });
          return { success: true, email: data.email };
        }),

      verifySignupOtp: ({ email, otp }) =>
        withLoading(set, async () => {
          const { token, user } = await verifySignupOtpApi({ email, otp });
          storage.set('token', token);
          set({ token, user, hasAccount: true });
          return { success: true };
        }),

      // fetchAccounts after login — user's accounts already exist on the server.
      login: ({ email, password, rememberMe = true }) =>
        withLoading(set, async () => {
          const { token, user } = await loginApi({ email, password });
          storage.set('token', token);
          set({ token, user, rememberMe, hasAccount: true });
          await useAccountStore.getState().fetchAccounts();
          return { success: true };
        }),

      // Call this after seedAccounts/createAccount succeeds on the onboarding screen
      // so the navigator re-renders without needing another /me fetch
      setOnboarded: (value = true) =>
        set(state => ({
          user: state.user ? { ...state.user, isOnboarded: value } : state.user,
        })),

      updateProfile: ({ name, phoneNumber }) =>
        withLoading(set, async () => {
          const user = await updateProfileApi({ name, phoneNumber });
          set({ user });
          return { success: true };
        }),

      uploadAvatar: (imageUri) =>
        withLoading(set, async () => {
          const { avatar } = await uploadAvatarApi(imageUri);
          set(state => ({
            user: state.user ? { ...state.user, avatar } : state.user,
          }));
          return { success: true, avatar };
        }),

      fetchMe: () =>
        withLoading(set, async () => {
          const user = await getMeApi();
          set({ user });
        }),

      logout: () => {
        storage.remove('token');
        // Clear cached user data on logout so it isn't shown on next login
        useAccountStore.getState().clearAccounts();
        clearQueryCache();
        cancelAllReminders().catch(() => {});
        useAppStore.setState({ checklistDismissed: false });
        set({ user: null, token: null, error: null, pendingAction: null });
      },

      // Server wipes all user data; locally it's just a logout since nothing else is cached.
      deleteAccount: ({ password }) =>
        withLoading(set, async () => {
          await deleteAccountApi({ password });
          get().logout();
          return { success: true };
        }),

      setPendingAction: action => set({ pendingAction: action }),
      
      clearPendingAction: () => set({ pendingAction: null }),

      setHasSeenCarousel: (value = true) => set({ hasSeenCarousel: value }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'paisly-auth-store',
      // Installs from before hasAccount existed: a stored token means an account
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        hasAccount: persisted?.hasAccount ?? !!persisted?.token,
      }),
      storage: createJSONStorage(() => mmkvStorage),
      partialize: state => {
        const partial = { 
          rememberMe: state.rememberMe,
          hasSeenCarousel: state.hasSeenCarousel,
          hasAccount: state.hasAccount,
        };
        if (state.rememberMe) {
          partial.token = state.token;
          partial.user = state.user;
        }
        return partial;
      },
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser = state => state.user;
export const selectToken = state => state.token;
export const selectIsAuthenticated = state => !!state.token;
export const selectIsOnboarded = state => !!state.user?.isOnboarded;
export const selectAuthLoading = state => state.isLoading;
export const selectAuthError = state => state.error;
export const selectDisplayName = state => state.user?.name || state.user?.email?.split('@')[0] || 'User';
export const selectPendingAction = state => state.pendingAction;
export const selectHasSeenCarousel = state => !!state.hasSeenCarousel;

export default useAuthStore;
