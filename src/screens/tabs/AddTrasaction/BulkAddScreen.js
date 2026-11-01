import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { CheckCircle } from 'lucide-react-native';
import { hp, wp } from '../../../constants/responsive';
import { Label, borderRadius } from '../../../constants/globalstyle';
import fonts from '../../../constants/fonts';
import { useThemeColors } from '@hooks/useThemeColors';
import KeyboardFormLayout from '../../../components/common/KeyboardFormLayout';
import ScreenHeader from '../../../components/common/Screenheader';
import ToggleButtons from '../../../components/ui/ToggleButtons';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import PaymentSourcePicker from '../../../components/addexpense/PaymentSourcePicker';
import PaymentSourceModal from '../../../components/modals/PaymentSourceModal';
import DateTimeRow from '../../../components/addexpense/DateTimeRow';
import CategoryModal from '../../../components/modals/CategoryModal';
import BulkPreviewRow from '../../../components/bulk/BulkPreviewRow';
import CurrencyView from '../../../components/common/CurrencyView';
import {
  CATEGORIES,
  INCOME_CATEGORIES,
} from '../../../constants/theme/accountMeta';
import {
  MAX_BULK_ENTRIES,
  parseBulkText,
  resolveRows,
  summariseRows,
} from '../../../utils/bulkEntryParser';
import { useCreateBulkTransactions } from '../../../queries/transactions';
import useAccountStore from '../../../store/useAccountStore';
import useCategoryStore from '../../../store/useCategoryStore';
import { useToastService } from '../../../utils/ToastService';

const PLACEHOLDER = 'chai 50\nrickshaw 120\nlunch 450\n+ salary 80000';

const toPickerItem = c => ({
  id: c._id,
  label: c.name,
  iconName: c.iconName,
  iconBg: c.iconBg,
  iconColor: c.iconColor,
  isCustom: true,
  raw: c,
});

const BulkAddScreen = ({ navigation, route }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();

  const accounts = useAccountStore(s => s.accounts);
  const customCategories = useCategoryStore(s => s.categories);
  const createBulk = useCreateBulkTransactions();

  const [defaultType, setDefaultType] = useState(
    route?.params?.type ?? 'expense',
  );
  const [text, setText] = useState('');
  const [sourceId, setSourceId] = useState(null);
  const [date, setDate] = useState(new Date());
  const [overrides, setOverrides] = useState({});
  const [categoryRow, setCategoryRow] = useState(null);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  // Default to the primary account, like Add Transaction
  useEffect(() => {
    if (sourceId === null && accounts.length > 0) {
      setSourceId((accounts.find(a => a.isPrimary) ?? accounts[0])._id);
    }
  }, [accounts, sourceId]);

  const rows = useMemo(
    () => resolveRows(parseBulkText(text, defaultType), overrides),
    [text, defaultType, overrides],
  );
  const summary = useMemo(() => summariseRows(rows), [rows]);

  // Investments need return settings that only the full Add screen collects
  const expenseCategories = useMemo(
    () => [
      ...CATEGORIES.filter(c => c.id !== 'investment'),
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

  const setOverride = useCallback((key, patch) => {
    setOverrides(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const toggleType = useCallback(
    row =>
      // A type flip re-detects the category, so drop any category picked for
      // the old type (it may not exist for the new one)
      setOverrides(prev => ({
        ...prev,
        [row.key]: {
          type: row.type === 'income' ? 'expense' : 'income',
        },
      })),
    [],
  );

  const tooMany = summary.count > MAX_BULK_ENTRIES;
  const canSubmit =
    summary.count > 0 &&
    summary.invalid === 0 &&
    !tooMany &&
    !!sourceId &&
    !createBulk.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const account = accounts.find(a => a._id === sourceId);
    if (!account) {
      toast.warning('Please select an account.');
      return;
    }
    // Same rule the server applies: the batch's net effect can't overdraw
    const net = summary.incomeTotal - summary.expenseTotal;
    if ((account.balance ?? 0) + net < 0) {
      toast.warning('Insufficient balance in this account.');
      return;
    }

    // First line is the newest, so History shows entries in the order typed
    const baseMs = date.getTime();
    const items = rows.map((row, index) => ({
      type: row.type,
      amount: row.amount,
      category: row.category,
      description: row.description,
      date: new Date(baseMs - index).toISOString(),
    }));

    try {
      await createBulk.mutateAsync({
        accountId: sourceId,
        date: date.toISOString(),
        items,
      });
      toast.success(
        `${items.length} transaction${items.length === 1 ? '' : 's'} added`,
      );
      navigation.navigate('TabNavigator', { screen: 'History' });
    } catch (e) {
      console.error('Bulk add failed:', e);
      const message = e?.message ?? 'Could not add transactions. Try again.';
      if (message === 'Insufficient balance.') {
        toast.warning('Insufficient balance in this account.');
      } else {
        toast.error(message);
      }
    }
  };

  const buttonLabel = createBulk.isPending
    ? 'Adding…'
    : summary.count === 0
    ? 'Add transactions'
    : `Add ${summary.count} transaction${summary.count === 1 ? '' : 's'}`;

  const footer = (
    <View style={styles.footer}>
      {summary.count > 0 && (
        <View style={styles.summaryRow}>
          {summary.expenseTotal > 0 && (
            <CurrencyView
              amount={summary.expenseTotal}
              type="bodySmall"
              weight="semiBold"
              negative
            />
          )}
          {summary.incomeTotal > 0 && (
            <CurrencyView
              amount={summary.incomeTotal}
              type="bodySmall"
              weight="semiBold"
              positive
            />
          )}
        </View>
      )}
      {summary.invalid > 0 && (
        <Label type="bodyXs" weight="regular" color="error" style={styles.centered}>
          Fix or remove {summary.invalid} line{summary.invalid === 1 ? '' : 's'}{' '}
          to continue
        </Label>
      )}
      {tooMany && (
        <Label type="bodyXs" weight="regular" color="error" style={styles.centered}>
          Up to {MAX_BULK_ENTRIES} entries at a time
        </Label>
      )}
      <PrimaryButton
        variant="primary"
        size="lg"
        label={buttonLabel}
        leftIcon={<CheckCircle size={wp(5)} color={theme.onPrimary} />}
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={createBulk.isPending}
      />
    </View>
  );

  const categoryOptions =
    categoryRow?.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <>
      <KeyboardFormLayout
        header={
          <ScreenHeader
            title="Bulk add"
            onBack={() => navigation.goBack()}
            backIcon="arrow"
          />
        }
        footer={footer}
        contentContainerStyle={styles.content}
      >
        <ToggleButtons
          options={[
            { value: 'expense', label: 'Expenses', color: theme.error },
            { value: 'income', label: 'Income' },
          ]}
          activeValue={defaultType}
          onSelect={setDefaultType}
          containerStyle={styles.toggle}
        />

        <View style={styles.inputCard}>
          <Label type="bodyMedium" weight="semiBold" color="textMain">
            One entry per line
          </Label>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={PLACEHOLDER}
            placeholderTextColor={theme.textMuted}
            multiline
            autoCapitalize="sentences"
            textAlignVertical="top"
            scrollEnabled={false}
            accessibilityLabel="Entries, one per line"
          />
          <Label type="bodyXs" weight="regular" color="textMuted" style={styles.hint}>
            Write a description and an amount, like "chai 50" or "rent 25k".
            Start a line with + for income or - for expense.
          </Label>
        </View>

        <PaymentSourcePicker
          activeId={sourceId}
          onSelect={setSourceId}
          onSeeAll={() => setSourceModalVisible(true)}
        />

        <DateTimeRow date={date} onChange={setDate} />

        {rows.length > 0 && (
          <View style={styles.preview}>
            <View style={styles.previewHeader}>
              <Label type="bodyMedium" weight="semiBold" color="textMain">
                Preview
              </Label>
              <Label type="bodyXs" weight="regular" color="textMuted">
                Tap a category or type to change it
              </Label>
            </View>
            {rows.map(row => (
              <BulkPreviewRow
                key={row.key}
                row={row}
                onCategoryPress={setCategoryRow}
                onTypeToggle={toggleType}
              />
            ))}
          </View>
        )}
      </KeyboardFormLayout>

      <CategoryModal
        visible={!!categoryRow}
        activeId={categoryRow?.category}
        categories={categoryOptions}
        onSelect={id => categoryRow && setOverride(categoryRow.key, { category: id })}
        onClose={() => setCategoryRow(null)}
      />

      <PaymentSourceModal
        visible={sourceModalVisible}
        activeId={sourceId}
        onSelect={setSourceId}
        onClose={() => setSourceModalVisible(false)}
      />
    </>
  );
};

const createStyles = t =>
  StyleSheet.create({
    content: {
      paddingBottom: hp(2),
      gap: hp(2.5),
    },
    toggle: {
      marginHorizontal: wp(5),
      marginTop: hp(1),
    },
    inputCard: {
      marginHorizontal: wp(5),
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: t.outlineVariant,
      padding: wp(4),
      gap: hp(1),
    },
    input: {
      minHeight: hp(16),
      padding: 0,
      fontFamily: fonts.regular,
      fontSize: RFValue(14),
      lineHeight: RFValue(22),
      color: t.textMain,
    },
    hint: {
      lineHeight: RFValue(15),
    },
    preview: {
      marginHorizontal: wp(5),
      gap: hp(1.2),
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footer: {
      paddingHorizontal: wp(5),
      paddingTop: hp(1.5),
      paddingBottom: hp(2),
      gap: hp(1),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: wp(4),
    },
    centered: {
      textAlign: 'center',
    },
  });

export default BulkAddScreen;
