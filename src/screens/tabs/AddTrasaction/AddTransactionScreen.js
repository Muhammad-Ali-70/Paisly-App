import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { CheckCircle } from 'lucide-react-native';
import { Label } from '../../../constants/globalstyle';
import AmountHeader from '../../../components/addexpense/AmountHeader';
import CategoryPicker from '../../../components/addexpense/CategoryPicker';
import DescriptionInput from '../../../components/addexpense/DescriptionInput';
import PaymentSourcePicker from '../../../components/addexpense/PaymentSourcePicker';
import DateTimeRow from '../../../components/addexpense/DateTimeRow';
import NotesInput from '../../../components/addexpense/NotesInput';
import TransactionTypeHeader from '../../../components/addexpense/TransactionTypeHeader';
import TransferLink from '../../../components/addexpense/TransferLink';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ToggleButtons from '../../../components/ui/ToggleButtons';
import CategoryModal from '../../../components/modals/CategoryModal';
import CreateCategoryModal from '../../../components/modals/CreateCategoryModal';
import PaymentSourceModal from '../../../components/modals/PaymentSourceModal';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../../constants/responsive';
import {
  CATEGORIES,
  INCOME_CATEGORIES,
} from '../../../constants/theme/accountMeta';
import { createInvestmentApi } from '../../../services/investmentService';
import { getAccountDebtsApi } from '../../../services/debtService';
import useAccountStore from '../../../store/useAccountStore';
import useTransactionStore from '../../../store/useTransactionStore';
import useCategoryStore from '../../../store/useCategoryStore';
import useAppStore from '../../../store/useAppStore';
import { useToastService } from '../../../utils/ToastService';
import InvestmentSetupModal from '../../../components/modals/investment/InvestmentSetupModal';
import { detectCategory } from '../../../utils/categoryDetector';

const toPickerItem = c => ({
  id: c._id,
  label: c.name,
  iconName: c.iconName,
  iconBg: c.iconBg,
  iconColor: c.iconColor,
  isCustom: true,
  raw: c,
});

const AddTransactionScreen = ({ navigation, route }) => {
  const initialType = route?.params?.type ?? 'expense';

  const accounts = useAccountStore(s => s.accounts);

  const customCategories = useCategoryStore(s => s.categories);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);

  const primaryAccount =
    accounts?.find(a => a.isPrimary) ?? accounts?.[0] ?? null;

  const [incomeCategory, setIncomeCategory] = useState('salary');
  const [incomeCategoryModalVisible, setIncomeCategoryModalVisible] =
    useState(false);

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('transport');
  const [sourceId, setSourceId] = useState(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [investmentModalVisible, setInvestmentModalVisible] = useState(false);
  const [investmentConfig, setInvestmentConfig] = useState(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [createCategoryVisible, setCreateCategoryVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [accountDebts, setAccountDebts] = useState([]);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [useDebtMoney, setUseDebtMoney] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState(null);

  const toast = useToastService();
  const theme = useThemeColors();
  const investmentDefaults = useAppStore(s => s.investmentDefaults);
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (primaryAccount && sourceId === null) {
      setSourceId(primaryAccount._id);
    }
  }, [primaryAccount, sourceId]);

  // Declared before the effects below that reference it (TDZ hazard otherwise)
  const isExpense = type === 'expense';

  const fetchAccountDebts = useCallback(async () => {
    if (!sourceId) return;
    setLoadingDebts(true);
    try {
      const data = await getAccountDebtsApi(sourceId, {
        status: ['active', 'partially_paid', 'overdue'].join(','),
        debtType: 'outstanding'
      });
      setAccountDebts(data.debts || []);
    } catch (err) {
      console.error('Failed to fetch account debts:', err);
      setAccountDebts([]);
    } finally {
      setLoadingDebts(false);
    }
  }, [sourceId]);

  useEffect(() => {
    if (sourceId && isExpense) {
      fetchAccountDebts();
    } else {
      setAccountDebts([]);
      setUseDebtMoney(false);
      setSelectedDebtId(null);
    }
  }, [sourceId, isExpense, fetchAccountDebts]);

  // Show investment setup modal when category is investment
  useEffect(() => {
    if (isExpense && category === 'investment') {
      setInvestmentModalVisible(true);
    }
    if (category !== 'investment') {
      setInvestmentConfig(null);
    }
  }, [category, isExpense]);

  // Merge built-in categories with the user's (non-archived) custom ones.
  const expenseCategories = useMemo(
    () => [
      ...CATEGORIES,
      ...customCategories
        .filter(c => !c.isArchived && c.type === 'expense')
        .map(toPickerItem),
    ],
    [customCategories],
  );

  const incomeCategories = useMemo(
    () => [
      ...INCOME_CATEGORIES,
      ...customCategories
        .filter(c => !c.isArchived && c.type === 'income')
        .map(toPickerItem),
    ],
    [customCategories],
  );

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCreateCategoryVisible(true);
  };

  const openEditCategory = raw => {
    setEditingCategory(raw);
    setCreateCategoryVisible(true);
  };

  const handleDescriptionChange = text => {
    setDescription(text);

    const detectedCategoryId = detectCategory(text, type);

    if (detectedCategoryId) {
      if (type === 'expense') {
        const categoryExists = expenseCategories.some(
          c => c.id === detectedCategoryId,
        );
        if (categoryExists) {
          setCategory(detectedCategoryId);
        }
      } else {
        const categoryExists = incomeCategories.some(
          c => c.id === detectedCategoryId,
        );
        if (categoryExists) {
          setIncomeCategory(detectedCategoryId);
        }
      }
    }
  };

  // Auto-select the newly created category (archived edits return null).
  const handleCategorySaved = cat => {
    if (!cat) return;
    if (cat.type === 'expense') setCategory(cat._id);
    else setIncomeCategory(cat._id);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!sourceId) {
      Alert.alert('No account', 'Please select an account.');
      return;
    }

    const isInvestment =
      isExpense && category === 'investment' && investmentConfig;

    if (!isInvestment) {
      const account = accounts.find(a => a._id === sourceId);
      if (!account) {
        Alert.alert('No account', 'Please select an account.');
        return;
      }
      // Same rule the server enforces; checked up front because the save
      // below is optimistic and the user will already have left this screen.
      if (isExpense && (account.balance ?? 0) < parsedAmount) {
        toast.warning('Insufficient balance in this account.');
        return;
      }

      const payload = {
        accountId: sourceId,
        type,
        amount: parsedAmount,
        category: isExpense ? category : incomeCategory,
        description: description.trim(),
        note: notes.trim(),
        date: date.toISOString(),
        debtId: useDebtMoney && selectedDebtId ? selectedDebtId : undefined,
      };
      const { _id, label, type: accountType, color, initials } = account;

      // Optimistic: the row shows up in History/Home right away and rolls
      // back with a toast if the server rejects it.
      useTransactionStore
        .getState()
        .createTransaction(payload, {
          _id,
          label,
          type: accountType,
          color,
          initials,
        })
        .catch(e => {
          console.error('Save transaction failed:', e);
          const message =
            e?.message ?? 'Could not save transaction. Please try again.';
          if (message === 'Insufficient balance.') {
            toast.warning('Insufficient balance in this account.');
          } else {
            toast.error(`Transaction not saved: ${message}`);
          }
        });

      navigation?.navigate('TabNavigator', { screen: 'History' });
      return;
    }

    setSaving(true);
    try {
      await createInvestmentApi({
        accountId: sourceId,
        amount: parsedAmount,
        category: 'investment',
        description: description.trim(),
        note: notes.trim(),
        date: date.toISOString(),
        title: description.trim() || 'Investment',
        ...investmentConfig,
      });

      useAccountStore.getState().fetchAccounts();
      useTransactionStore.getState().invalidate();
      navigation?.navigate('TabNavigator', { screen: 'History' });
    } catch (e) {
      console.error('Save investment failed:', e);

      const message =
        e?.message ?? 'Could not save transaction. Please try again.';

      if (message === 'Insufficient balance.') {
        toast.warning('Insufficient balance in this account.');
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior="padding"
      automaticOffset
    >
      <TransactionTypeHeader
        type={type}
        onTypeChange={setType}
        onClose={() => navigation?.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AmountHeader
          value={amount}
          onChangeText={setAmount}
          label={isExpense ? 'AMOUNT SPENT' : 'AMOUNT RECEIVED'}
        />

        <View style={styles.form}>
          <DescriptionInput
            value={description}
            onChangeText={handleDescriptionChange}
          />

          {isExpense ? (
            <CategoryPicker
              activeId={category}
              onSelect={setCategory}
              onSeeAll={() => setCategoryModalVisible(true)}
              onCreateNew={openCreateCategory}
              categories={expenseCategories}
            />
          ) : (
            <CategoryPicker
              activeId={incomeCategory}
              onSelect={setIncomeCategory}
              onSeeAll={() => setIncomeCategoryModalVisible(true)}
              onCreateNew={openCreateCategory}
              categories={incomeCategories}
            />
          )}

          <PaymentSourcePicker
            activeId={sourceId}
            onSelect={setSourceId}
            onSeeAll={() => setSourceModalVisible(true)}
          />

          {isExpense && accountDebts.length > 0 && (
            <View style={styles.debtSection}>
              <Label type="bodyMedium" weight="semiBold" color="textMain">
                Fund Transaction
              </Label>
              <ToggleButtons
                options={[
                  { value: false, label: 'Regular Money' },
                  { value: true, label: 'Debt Money' },
                ]}
                activeValue={useDebtMoney}
                onSelect={setUseDebtMoney}
              />
              
              {useDebtMoney && (
                <View style={styles.debtPicker}>
                  <Label type="bodySmall" weight="semiBold" color="textMain">
                    Select Debt
                  </Label>
                  <View style={styles.debtList}>
                    {accountDebts.map(debt => (
                      <TouchableOpacity
                        key={debt._id}
                        style={[
                          styles.debtItem,
                          selectedDebtId === debt._id && styles.debtItemActive,
                        ]}
                        onPress={() => setSelectedDebtId(debt._id)}
                      >
                        <View style={styles.debtItemInfo}>
                          <Label 
                            type="bodySmall" 
                            weight="semiBold" 
                            color={selectedDebtId === debt._id ? 'onPrimary' : 'textMain'}
                          >
                            {debt.description || debt.counterpartyName}
                          </Label>
                          <Label 
                            type="bodyXs" 
                            weight="regular" 
                            color={selectedDebtId === debt._id ? 'onPrimary' : 'textMuted'}
                          >
                            Remaining: PKR {debt.remainingAmount?.toLocaleString()}
                          </Label>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          <TransferLink
            onPress={() =>
              navigation?.navigate('TabNavigator', {
                screen: 'User',
                params: { screen: 'TransferScreen', initial: false },
              })
            }
          />

          <DateTimeRow date={date} onChange={setDate} />

          <NotesInput value={notes} onChangeText={setNotes} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          variant="primary"
          size="lg"
          label={
            saving ? 'Saving…' : isExpense ? 'Save Expense' : 'Save Income'
          }
          icon={CheckCircle}
          onPress={handleSave}
          disabled={saving}
        />
      </View>

      <CategoryModal
        visible={categoryModalVisible}
        activeId={category}
        onSelect={setCategory}
        onClose={() => setCategoryModalVisible(false)}
        categories={expenseCategories}
        onCreateNew={() => {
          setCategoryModalVisible(false);
          openCreateCategory();
        }}
        onEditCategory={raw => {
          setCategoryModalVisible(false);
          openEditCategory(raw);
        }}
      />

      <CategoryModal
        visible={incomeCategoryModalVisible}
        activeId={incomeCategory}
        onSelect={setIncomeCategory}
        onClose={() => setIncomeCategoryModalVisible(false)}
        categories={incomeCategories}
        onCreateNew={() => {
          setIncomeCategoryModalVisible(false);
          openCreateCategory();
        }}
        onEditCategory={raw => {
          setIncomeCategoryModalVisible(false);
          openEditCategory(raw);
        }}
      />

      <PaymentSourceModal
        visible={sourceModalVisible}
        activeId={sourceId}
        onSelect={setSourceId}
        onClose={() => setSourceModalVisible(false)}
      />

      <InvestmentSetupModal
        visible={investmentModalVisible}
        onClose={() => setInvestmentModalVisible(false)}
        onConfirm={setInvestmentConfig}
        defaults={investmentDefaults}
      />

      <CreateCategoryModal
        visible={createCategoryVisible}
        type={type}
        editingCategory={editingCategory}
        onClose={() => setCreateCategoryVisible(false)}
        onSaved={handleCategorySaved}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    scrollContent: {
      paddingBottom: hp(2),
    },
    form: {
      paddingTop: hp(2.5),
      gap: hp(2.5),
    },
    footer: {
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      backgroundColor: t.background,
    },
    debtSection: {
      marginHorizontal: wp(5),
      gap: hp(1.5),
      padding: wp(4),
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    debtPicker: {
      gap: hp(1),
    },
    debtList: {
      gap: hp(1),
    },
    debtItem: {
      padding: wp(3),
      backgroundColor: t.surfaceContainer,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    debtItemActive: {
      backgroundColor: t.primary,
      borderColor: t.primary,
    },
    debtItemInfo: {
      gap: hp(0.3),
    },
  });

export default AddTransactionScreen;
