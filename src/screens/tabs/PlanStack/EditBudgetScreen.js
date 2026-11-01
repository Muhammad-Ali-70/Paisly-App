import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Plus, X } from 'lucide-react-native';
import ScreenHeader from '../../../components/common/Screenheader';
import AppTextInput from '../../../components/ui/AppTextInput';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { useThemeColors } from '@hooks/useThemeColors';
import { borderRadius, Label } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import {
  CATEGORIES,
  getCategoryMeta,
  getCategoryLabel,
} from '../../../constants/theme/accountMeta';
import { useToastService } from '../../../utils/ToastService';
import {
  useBudgetTemplates,
  useCurrentBudget,
  useSaveBudget,
} from '../../../queries/budget';
import useCategoryStore from '../../../store/useCategoryStore';
import BudgetTemplateModal from '../../../components/modals/budget/BudgetTemplateModal';
import PaymentIcon from '../../../components/common/Paymenticon';

const BuiltInExpenseCategories = CATEGORIES.filter(c => c.id !== 'income');

const CategoryLimitItem = ({
  category,
  value,
  onChange,
  onRemove,
  s,
  theme,
}) => (
  <View style={s.limitRow}>
    <View style={s.limitIcon}>
      <PaymentIcon
        name={category.iconName}
        backgroundColor={category.iconBg}
        color={category.iconColor}
        containerSize={wp(9)}
        size={wp(4)}
      />
    </View>
    <View style={s.limitInfo}>
      <Label type="bodySmall" weight="semiBold" color="textMain">
        {category.label}
      </Label>
    </View>
    <AppTextInput
      value={value}
      onChangeText={onChange}
      placeholder="0"
      keyboardType="numeric"
      containerStyle={s.limitInput}
    />
    <TouchableOpacity
      onPress={onRemove}
      activeOpacity={0.7}
      style={s.removeBtn}
    >
      <X size={wp(4)} color={theme.textMuted} strokeWidth={2} />
    </TouchableOpacity>
  </View>
);

const EditBudgetScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();
  const { mutateAsync: saveBudget, isPending: saving } = useSaveBudget();
  const { data: templates = [] } = useBudgetTemplates(50000);
  // Start from the saved budget so editing doesn't silently wipe it
  const { data: currentBudget } = useCurrentBudget();
  const existing = currentBudget?.budget;

  const now = useMemo(() => new Date(), []);
  const [totalLimit, setTotalLimit] = useState(() =>
    existing?.totalLimit ? String(existing.totalLimit) : '',
  );
  const [categoryLimits, setCategoryLimits] = useState(() =>
    (existing?.categoryLimits ?? []).map(cl => ({
      category: cl.category,
      limit: String(cl.limit),
    })),
  );
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  // If the budget arrives after mount (cold cache), prefill once — unless the
  // user has already started typing.
  const prefilled = useRef(!!existing);
  useEffect(() => {
    if (prefilled.current || !existing) return;
    prefilled.current = true;
    if (totalLimit || categoryLimits.length) return;
    setTotalLimit(String(existing.totalLimit));
    setCategoryLimits(
      (existing.categoryLimits ?? []).map(cl => ({
        category: cl.category,
        limit: String(cl.limit),
      })),
    );
  }, [existing, totalLimit, categoryLimits.length]);

  const customCategories = useCategoryStore(s => s.categories);

  // Built-in expense categories + the user's own (non-archived) custom ones.
  const allExpenseCategories = useMemo(
    () => [
      ...BuiltInExpenseCategories,
      ...customCategories
        .filter(c => !c.isArchived && c.type === 'expense')
        .map(c => ({
          id: c._id,
          label: c.name,
          iconName: c.iconName,
          iconBg: c.iconBg,
          iconColor: c.iconColor,
        })),
    ],
    [customCategories],
  );

  // Derived: everything not already assigned a limit.
  const availableCategories = useMemo(() => {
    const used = new Set(categoryLimits.map(cl => cl.category));
    return allExpenseCategories.filter(c => !used.has(c.id));
  }, [allExpenseCategories, categoryLimits]);

  const addCategoryLimit = useCallback(category => {
    setCategoryLimits(prev => [...prev, { category: category.id, limit: '' }]);
  }, []);

  const updateCategoryLimit = useCallback((categoryId, value) => {
    setCategoryLimits(prev =>
      prev.map(cl =>
        cl.category === categoryId ? { ...cl, limit: value } : cl,
      ),
    );
  }, []);

  const removeCategoryLimit = useCallback(categoryId => {
    setCategoryLimits(prev => prev.filter(cl => cl.category !== categoryId));
  }, []);

  const handleTemplateSelect = useCallback(
    template => {
      const validLimits = template.categoryLimits.filter(cl =>
        allExpenseCategories.some(c => c.id === cl.category),
      );
      setCategoryLimits(
        validLimits.map(cl => ({
          category: cl.category,
          limit: String(cl.limit),
        })),
      );
    },
    [allExpenseCategories],
  );

  const handleSave = useCallback(async () => {
    if (!totalLimit || parseFloat(totalLimit) <= 0) {
      toast.warning('Please enter a valid total budget');
      return;
    }

    try {
      await saveBudget({
        month: now.getMonth(),
        year: now.getFullYear(),
        totalLimit: parseFloat(totalLimit),
        categoryLimits: categoryLimits
          .filter(cl => cl.limit && parseFloat(cl.limit) > 0)
          .map(cl => ({ category: cl.category, limit: parseFloat(cl.limit) })),
      });
      toast.success('Budget saved successfully');
      navigation.goBack();
    } catch (e) {
      toast.error(e?.message || 'Failed to save budget');
    }
  }, [totalLimit, categoryLimits, now, saveBudget, navigation, toast]);

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Edit Budget"
        onBack={() => navigation.goBack()}
        backIcon="close"
      />
      <KeyboardAwareScrollView
        bottomOffset={hp(3)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Label
          type="bodyXs"
          weight="semiBold"
          color="textMuted"
          style={styles.sectionLabel}
        >
          TOTAL MONTHLY BUDGET
        </Label>
        <AppTextInput
          value={totalLimit}
          onChangeText={setTotalLimit}
          placeholder="e.g., 50000"
          keyboardType="numeric"
          leftIconName="card"
        />

        <View style={styles.templateRow}>
          <Label type="bodySmall" weight="semiBold" color="textMuted">
            Need a starting point?
          </Label>
          <TouchableOpacity
            onPress={() => setTemplateModalVisible(true)}
            activeOpacity={0.7}
          >
            <Label type="bodySmall" weight="semiBold" color="primary" underline>
              Use a template
            </Label>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Label
            type="bodyXs"
            weight="semiBold"
            color="textMuted"
            style={styles.sectionLabel}
          >
            CATEGORY LIMITS
          </Label>
          <Label type="bodyXs" weight="regular" color="textMuted">
            {categoryLimits.length}/{allExpenseCategories.length} set
          </Label>
        </View>

        {categoryLimits.map(cl => {
          const meta = getCategoryMeta(cl.category);
          return (
            <CategoryLimitItem
              key={cl.category}
              category={{
                ...meta,
                label: getCategoryLabel(cl.category),
              }}
              value={cl.limit}
              onChange={v => updateCategoryLimit(cl.category, v)}
              onRemove={() => removeCategoryLimit(cl.category)}
              s={styles}
              theme={theme}
            />
          );
        })}

        {availableCategories.length > 0 && (
          <View style={styles.addSection}>
            <Label
              type="bodySmall"
              weight="semiBold"
              color="textMuted"
              style={styles.addLabel}
            >
              Add a category limit
            </Label>
            <View style={styles.availableList}>
              {availableCategories.map(cat => {
                const meta = getCategoryMeta(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.addCategoryBtn}
                    onPress={() => addCategoryLimit(cat)}
                    activeOpacity={0.7}
                  >
                    <PaymentIcon
                      name={meta.iconName}
                      backgroundColor={meta.iconBg}
                      color={meta.iconColor}
                      containerSize={wp(7)}
                      size={wp(3.2)}
                    />
                    <Label type="bodyXs" weight="semiBold" color="textMain">
                      {cat.label}
                    </Label>
                    <Plus
                      size={wp(3.5)}
                      color={theme.primary}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={saving ? 'Saving...' : 'Save Budget'}
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </KeyboardAwareScrollView>

      <BudgetTemplateModal
        visible={templateModalVisible}
        templates={templates}
        onSelect={handleTemplateSelect}
        onClose={() => setTemplateModalVisible(false)}
      />
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    scrollContent: { paddingBottom: hp(12), paddingHorizontal: wp(5) },
    sectionLabel: {
      letterSpacing: 0.8,
      marginBottom: hp(0.8),
      marginTop: hp(2.5),
    },
    templateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: hp(1.5),
    },
    divider: {
      height: 1,
      backgroundColor: t.outlineVariant,
      marginVertical: hp(2.5),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.5),
    },
    limitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
      paddingVertical: hp(1.2),
    },
    limitIcon: { width: wp(9), alignItems: 'center' },
    limitInfo: { flex: 1 },
    limitInput: { width: wp(22), marginBottom: 0 },
    removeBtn: { padding: wp(1.5) },
    addSection: { marginTop: hp(2) },
    addLabel: { marginBottom: hp(1.5) },
    availableList: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
    addCategoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
      paddingHorizontal: wp(1.5),
      paddingVertical: hp(1),
      borderRadius: borderRadius.full,
      backgroundColor: t.surfaceSecondary,
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    footer: { marginTop: hp(3) },
  });

export default EditBudgetScreen;
