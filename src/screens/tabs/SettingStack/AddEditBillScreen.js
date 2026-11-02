import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { CheckCircle } from 'lucide-react-native';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../../constants/responsive';
import { Label } from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import AppTextInput from '../../../components/ui/AppTextInput';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ToggleButtons from '../../../components/ui/ToggleButtons';
import DebtDatePicker from '../../../components/ui/DebtDatePicker';
import CategoryPicker from '../../../components/addexpense/CategoryPicker';
import PaymentSourcePicker from '../../../components/addexpense/PaymentSourcePicker';
import CategoryModal from '../../../components/modals/CategoryModal';
import PaymentSourceModal from '../../../components/modals/PaymentSourceModal';
import { CATEGORIES, INCOME_CATEGORIES } from '../../../constants/theme/accountMeta';
import useAccountStore from '../../../store/useAccountStore';
import useCategoryStore from '../../../store/useCategoryStore';
import {
  useDeleteRecurring,
  useRecurring,
  useSaveRecurring,
} from '../../../queries/recurring';
import { useToastService } from '../../../utils/ToastService';
import { sanitiseInput } from '../../../utils/currency';
import { FREQUENCY_OPTIONS, toDayString } from '../../../utils/recurring';
import { calendarDay } from '../../../utils/safeToSpend';

const toPickerItem = c => ({
  id: c._id,
  label: c.name,
  iconName: c.iconName,
  iconBg: c.iconBg,
  iconColor: c.iconColor,
  isCustom: true,
  raw: c,
});

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const AddEditBillScreen = ({ navigation, route }) => {
  const { billId } = route.params || {};
  const isEditing = !!billId;

  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();

  const accounts = useAccountStore(s => s.accounts);
  const customCategories = useCategoryStore(s => s.categories);
  const { data: bills = [] } = useRecurring();
  const saveBill = useSaveRecurring();
  const deleteBill = useDeleteRecurring();

  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [dueDate, setDueDate] = useState(startOfToday());
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [accountId, setAccountId] = useState(
    accounts.find(a => a.isPrimary)?._id ?? accounts[0]?._id ?? null,
  );
  const [isActive, setIsActive] = useState(true);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  // Fill the form once; later refetches must not overwrite edits
  const filled = useRef(false);
  useEffect(() => {
    const bill = bills.find(b => b._id === billId);
    if (!isEditing || !bill || filled.current) return;
    filled.current = true;
    setType(bill.type);
    setTitle(bill.title);
    setAmount(String(bill.amount));
    setFrequency(bill.frequency);
    setDueDate(calendarDay(bill.nextDueDate));
    setCategory(bill.category);
    setAccountId(bill.accountId?._id ?? bill.accountId);
    setIsActive(bill.isActive);
  }, [bills, billId, isEditing]);

  const categories = useMemo(() => {
    const builtIn = type === 'income' ? INCOME_CATEGORIES : CATEGORIES;
    return [
      ...builtIn,
      ...customCategories
        .filter(c => !c.isArchived && c.type === type)
        .map(toPickerItem),
    ];
  }, [type, customCategories]);

  // Switching expense/income: keep the pick if it exists there, else the first
  useEffect(() => {
    if (!categories.some(c => c.id === category)) setCategory(categories[0].id);
  }, [categories, category]);

  const handleSave = () => {
    const value = Number(String(amount).replace(/,/g, ''));
    if (!title.trim()) return toast.warning('Give the bill a name');
    if (!(value > 0)) return toast.warning('Enter an amount');
    if (!accountId) return toast.warning('Choose an account');

    saveBill.mutate(
      {
        id: billId,
        data: {
          type,
          title: title.trim(),
          amount: value,
          category,
          accountId,
          frequency,
          nextDueDate: toDayString(dueDate),
          isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(isEditing ? 'Bill updated' : 'Bill added');
          navigation.goBack();
        },
        onError: e => toast.error(e?.message ?? 'Could not save the bill'),
      },
    );
  };

  const handleDelete = () =>
    Alert.alert(
      `Delete ${title || 'this bill'}?`,
      'Transactions already recorded from it stay in your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteBill.mutate(billId, {
              onSuccess: () => navigation.goBack(),
              onError: e => toast.error(e?.message ?? 'Could not delete the bill'),
            }),
        },
      ],
    );

  const saving = saveBill.isPending;

  return (
    <KeyboardAvoidingView style={styles.safe} behavior="padding" automaticOffset>
      <ScreenHeader
        title={isEditing ? 'Edit Bill' : 'Add Recurring Bill'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.toggleWrap}>
        <ToggleButtons
          options={[
            { value: 'expense', label: 'Bill / Expense', color: theme.error },
            { value: 'income', label: 'Income', color: theme.primary },
          ]}
          activeValue={type}
          onSelect={setType}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <AppTextInput
            label="Name"
            placeholder={type === 'income' ? 'e.g., Salary' : 'e.g., Rent, Electricity'}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
          <AppTextInput
            label="Amount"
            placeholder="0"
            value={amount}
            onChangeText={text => setAmount(sanitiseInput(text))}
            keyboardType="numeric"
            leftIconName="card"
          />

          <View>
            <Label type="bodySmall" weight="semiBold" color="textMain" style={styles.label}>
              Repeats
            </Label>
            <ToggleButtons
              options={FREQUENCY_OPTIONS}
              activeValue={frequency}
              onSelect={setFrequency}
            />
          </View>

          <DebtDatePicker
            label={isEditing ? 'Next due date' : 'First due date'}
            date={dueDate}
            onChange={setDueDate}
            minimumDate={isEditing ? undefined : startOfToday()}
          />

          <CategoryPicker
            activeId={category}
            onSelect={setCategory}
            onSeeAll={() => setCategoryModalVisible(true)}
            categories={categories}
          />

          <PaymentSourcePicker
            activeId={accountId}
            onSelect={setAccountId}
            onSeeAll={() => setSourceModalVisible(true)}
          />

          {isEditing ? (
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Label type="bodySmall" weight="semiBold" color="textMain">
                  Active
                </Label>
                <Label type="bodyXs" weight="regular" color="textMuted">
                  Pause it to stop reminders without deleting
                </Label>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{
                  false: theme.outlineVariant,
                  true: theme.primaryContainer,
                }}
                thumbColor={isActive ? theme.primary : theme.surfacePrimary}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          variant="primary"
          size="lg"
          label={saving ? 'Saving…' : isEditing ? 'Update Bill' : 'Add Bill'}
          leftIcon={<CheckCircle size={wp(5)} color={theme.onPrimary} />}
          onPress={handleSave}
          disabled={saving}
        />
        {isEditing ? (
          <PrimaryButton
            variant="dangerOutline"
            size="lg"
            label="Delete bill"
            onPress={handleDelete}
            disabled={deleteBill.isPending}
          />
        ) : null}
      </View>

      <CategoryModal
        visible={categoryModalVisible}
        activeId={category}
        onSelect={setCategory}
        onClose={() => setCategoryModalVisible(false)}
        categories={categories}
      />
      <PaymentSourceModal
        visible={sourceModalVisible}
        activeId={accountId}
        onSelect={setAccountId}
        onClose={() => setSourceModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    toggleWrap: { paddingHorizontal: wp(5), paddingTop: hp(2) },
    scrollContent: { paddingHorizontal: wp(5), paddingTop: hp(2), paddingBottom: hp(22) },
    form: { gap: hp(1.5) },
    label: { marginBottom: hp(0.7) },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: t.surfacePrimary,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.6),
      borderRadius: 16,
      gap: wp(3),
    },
    switchText: { flex: 1, gap: hp(0.3) },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      gap: hp(1),
      backgroundColor: t.background,
    },
  });

export default AddEditBillScreen;
