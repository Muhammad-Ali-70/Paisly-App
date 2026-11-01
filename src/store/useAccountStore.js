import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../services/apiClient';
import { mmkvStorage } from '../services/storage';

// Accounts are persisted so balances show instantly on cold start; screens
// still refetch in the background.
const useAccountStore = create(
  persist(
    (set, get) => ({
      accounts: [],
      loading: false,
      error: null,

      fetchAccounts: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get('/accounts');
          set({ accounts: response.data, loading: false });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      updateAccount: async (id, data) => {
        try {
          const response = await apiClient.put(`/accounts/${id}`, data);
          const updated = response.data;
          set(state => ({
            accounts: state.accounts.map(a => a._id === id ? updated : a),
          }));
          return { success: true, account: updated };
        } catch (err) {
          // apiClient's interceptor flattens errors: the server message is err.message
          return { success: false, message: err.message };
        }
      },

      archiveAccount: async (id) => {
        try {
          const response = await apiClient.delete(`/accounts/${id}`);
          set(state => ({
            accounts: state.accounts.filter(a => a._id !== id),
          }));
          return { 
            success: true, 
            newPrimaryId: response.data.newPrimaryId,
            newPrimaryLabel: response.data.newPrimaryLabel,
          };
        } catch (err) {
          return { success: false, message: err.message };
        }
      },

      clearAccounts: () => set({ accounts: [], loading: false, error: null }),
    }),
    {
      name: 'account-cache',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: state => ({ accounts: state.accounts }),
    },
  ),
);

export default useAccountStore;
