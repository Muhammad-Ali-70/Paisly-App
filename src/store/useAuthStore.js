import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, mmkvStorage } from '../services/storage';
import { signupApi, loginApi, googleAuthApi, getMeApi, verifySignupOtpApi, updateProfileApi, uploadAvatarApi, deleteAccountApi } from '../services/authService';
import { getGoogleIdToken, signOutGoogle, revokeGoogle } from '../services/googleAuth';
import useAccountStore from './useAccountStore';
import useAppStore from './useAppStore';
import useCategoryStore from './useCategoryStore';
import { clearQueryCache } from '../services/queryClient';
import { cancelAllReminders } from '../services/remindersService';
import { clearWidget } from '../widget/widgetSnapshot';

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

// Wipes everything cached for the signed-in user: server data, accounts, the
// home-screen widget and scheduled reminders. Used on logout, and on a cold
// start with no session (a "Remember me" off login leaves no token behind, so
// its cached data must not outlive the app process).
const clearLocalUserData = ({ deferNative = false } = {}) => {
  // Legacy: older builds kept a second copy of the token under this key
  storage.remove('token');
  useAccountStore.getState().clearAccounts();
  clearQueryCache();
  const clearNative = () => {
    cancelAllReminders().catch(() => {});
    clearWidget();
  };
  // At module init (store hydration) native modules may not be ready yet
  if (deferNative) setTimeout(clearNative, 0);
  else clearNative();
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
          set({ token, user, rememberMe: true, hasAccount: true });
          return { success: true };
        }),

      // fetchAccounts after login — user's accounts already exist on the server.
      login: ({ email, password, rememberMe = true }) =>
        withLoading(set, async () => {
          const { token, user } = await loginApi({ email, password });
          // Persisted by partialize only when rememberMe is on
          set({ token, user, rememberMe, hasAccount: true });
          await useAccountStore.getState().fetchAccounts();
          return { success: true };
        }),

      // Sign in or sign up with Google. Doesn't touch the shared isLoading flag, so the
      // email form's button doesn't spin; the Google button tracks its own loading state.
      // Resolves { success } | { cancelled } | { success: false, message }.
      googleLogin: async () => {
        try {
          const { idToken, cancelled } = await getGoogleIdToken();
          if (cancelled) return { cancelled: true };

          const { token, user, isNewUser } = await googleAuthApi({ idToken });
          set({ token, user, rememberMe: true, hasAccount: true, error: null });
          // Existing users already have accounts on the server; new ones go to onboarding.
          if (!isNewUser) await useAccountStore.getState().fetchAccounts();
          return { success: true, isNewUser };
        } catch (err) {
          return { success: false, message: err.message };
        }
      },

      // Call this after seedAccounts/createAccount succeeds on the onboarding screen
      // so the navigator re-renders without needing another /me fetch
      setOnboarded: (value = true) =>
        set(state => ({
          user: state.user ? { ...state.user, isOnboarded: value } : state.user,
        })),

      updateProfile: ({ name, phoneNumber }) =>
        withLoading(set, async () => {
          const user = await updateProfileApi({ name, phoneNumber });
          // Merge: the profile endpoint omits computed fields like isGoogleLinked/hasPassword
          set(state => ({ user: { ...state.user, ...user } }));
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

      // Quiet profile refresh on launch: keeps isOnboarded/hasPassword/isGoogleLinked
      // current (they decide navigation and the delete-account flow). Doesn't touch
      // isLoading/error, and a 401 here logs out through the API client as usual.
      refreshMe: async () => {
        try {
          const user = await getMeApi();
          if (get().token) set({ user });
        } catch {
          // Offline or server asleep: keep the cached profile
        }
      },

      logout: () => {
        signOutGoogle();
        // Clear cached user data on logout so it isn't shown on next login
        clearLocalUserData();
        // Per-user settings (payday, reminders, defaults) and custom categories
        useAppStore.getState().resetUserData();
        useCategoryStore.getState().clearCategories();
        set({ user: null, token: null, error: null, pendingAction: null });
      },

      // Server wipes all user data; locally it's just a logout since nothing else is cached.
      // Password accounts pass `password`. Google-only accounts (hasPassword === false)
      // re-confirm through the Google picker instead.
      deleteAccount: async ({ password } = {}) => {
        const usesGoogle = get().user?.hasPassword === false;
        let idToken;
        if (usesGoogle) {
          try {
            const result = await getGoogleIdToken();
            if (result.cancelled) return { cancelled: true };
            idToken = result.idToken;
          } catch (err) {
            return { success: false, message: err.message };
          }
        }
        return withLoading(set, async () => {
          await deleteAccountApi(usesGoogle ? { idToken } : { password });
          if (get().user?.isGoogleLinked) await revokeGoogle();
          get().logout();
          return { success: true };
        });
      },

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
      // No persisted session means the last user either logged out or chose
      // "Remember me" off: drop whatever they left cached on the device.
      onRehydrateStorage: () => state => {
        if (!state?.token) clearLocalUserData({ deferNative: true });
      },
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
export const selectIsGoogleLinked = state => !!state.user?.isGoogleLinked;
export const selectPendingAction = state => state.pendingAction;
export const selectHasSeenCarousel = state => !!state.hasSeenCarousel;

export default useAuthStore;
