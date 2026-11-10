import { create } from 'zustand';
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from '../services/categoryService';
import { registerCustomCategories } from '../constants/theme/accountMeta';

// Holds the user's custom categories. The full list (including archived ones) is
// pushed into the meta registry so historical transactions still resolve their
// icon/label; pickers use the non-archived selectors below.
const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  /** Logout: the next user must not see these in pickers or History. */
  clearCategories: () => {
    registerCustomCategories([]);
    set({ categories: [], loading: false, error: null });
  },

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      // includeArchived so the registry can resolve meta for archived categories.
      const data = await getCategoriesApi({ includeArchived: true });
      registerCustomCategories(data);
      set({ categories: data, loading: false });
    } catch (err) {
      set({ error: err?.message || 'Failed to load categories', loading: false });
    }
  },

  addCategory: async payload => {
    try {
      const created = await createCategoryApi(payload);
      const next = [...get().categories, created];
      registerCustomCategories(next);
      set({ categories: next });
      return { success: true, category: created };
    } catch (err) {
      return { success: false, message: err?.message || 'Failed to create category' };
    }
  },

  updateCategory: async (id, fields) => {
    try {
      const updated = await updateCategoryApi(id, fields);
      const next = get().categories.map(c => (c._id === id ? updated : c));
      registerCustomCategories(next);
      set({ categories: next });
      return { success: true, category: updated };
    } catch (err) {
      return { success: false, message: err?.message || 'Failed to update category' };
    }
  },

  archiveCategory: async id => {
    try {
      await deleteCategoryApi(id);
      const next = get().categories.map(c =>
        c._id === id ? { ...c, isArchived: true } : c,
      );
      registerCustomCategories(next);
      set({ categories: next });
      return { success: true };
    } catch (err) {
      return { success: false, message: err?.message || 'Failed to archive category' };
    }
  },
}));

// Selectors: visible (non-archived) custom categories for a given transaction type.
export const selectVisibleCategories = type => state =>
  state.categories.filter(c => !c.isArchived && c.type === type);

export default useCategoryStore;
