import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  ArrowRightLeft,
  ArrowDownUp,
  ArrowDown,
  CheckCircle,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import {
  Label,
  borderRadius,
  shadowCard,
} from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import AppTextInput from '../../../components/ui/AppTextInput';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import CurrencyView from '../../../components/common/CurrencyView';
import PaymentIcon from '../../../components/common/Paymenticon';
import AccountAvatar from '../../../components/ui/AccountAvatar';
import { transferFundsApi } from '../../../services/accountService';
import { getAccountTypeMeta } from '../../../constants/theme/accountMeta';
import { getAccountMeta } from '../../../utils/accountMetaLookup';
import useAccountStore from '../../../store/useAccountStore';
import { queryClient } from '../../../services/queryClient';
import { invalidateTransactionData } from '../../../queries/transactions';
import { useToastService } from '../../../utils/ToastService';

const TransferScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();
  const accounts = useAccountStore(s => s.accounts);
  const fetchAccounts = useAccountStore(s => s.fetchAccounts);

  const [fromAccountId, setFromAccountId] = useState(null);
  const [toAccountId, setToAccountId] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Transfer');
  const [saving, setSaving] = useState(false);
  const [pickerMode, setPickerMode] = useState(null); // 'from' | 'to' | null

  const fromAccount = useMemo(
    () => accounts.find(a => a._id === fromAccountId),
    [accounts, fromAccountId],
  );
  const toAccount = useMemo(
    () => accounts.find(a => a._id === toAccountId),
    [accounts, toAccountId],
  );

  const handleSwap = useCallback(() => {
    setFromAccountId(toAccountId);
    setToAccountId(fromAccountId);
  }, [fromAccountId, toAccountId]);

  const handleTransfer = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      Alert.alert(
        'Missing Accounts',
        'Please select both source and destination accounts.',
      );
      return;
    }
    if (fromAccount && fromAccount.balance < parsedAmount) {
      Alert.alert(
        'Insufficient Balance',
        `Only PKR ${fromAccount.balance.toLocaleString()} available in ${
          fromAccount.label
        }.`,
      );
      return;
    }

    setSaving(true);
    try {
      const tx = await transferFundsApi({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        description: description.trim() || undefined,
      });
      await fetchAccounts();
      invalidateTransactionData(queryClient);
      toast.success('Transfer completed');
      navigation.goBack();
    } catch (e) {
      const msg = e?.message || 'Transfer failed.';
      if (msg === 'Insufficient balance in source account.') {
        toast.warning('Insufficient balance in source account.');
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [
    amount,
    fromAccountId,
    toAccountId,
    fromAccount,
    description,
    fetchAccounts,
    navigation,
    toast,
  ]);

  // ── Account picker modal ──
  const pickerAccounts = useMemo(() => {
    if (!pickerMode) return [];
    const excludeId = pickerMode === 'to' ? fromAccountId : null;
    return accounts.filter(a => a._id !== excludeId);
  }, [accounts, pickerMode, fromAccountId]);

  const pickerGroups = useMemo(() => {
    return ['wallet', 'bank', 'digitalWallet']
      .map(type => ({
        type,
        label: getAccountTypeMeta(type).label?.toUpperCase() + 'S',
        items: pickerAccounts.filter(a => a.type === type),
      }))
      .filter(g => g.items.length > 0);
  }, [pickerAccounts]);

  const AccountCard = ({ account, selected, onPress, showBalance }) => {
    const meta = getAccountTypeMeta(account.type);
    const imageMeta = getAccountMeta(account.type, account.sourceId);
    return (
      <TouchableOpacity
        style={[
          styles.accountCard,
          selected && styles.accountCardSelected,
          { borderColor: selected ? theme.primary : theme.outlineVariant },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {imageMeta?.imageUri ? (
          <AccountAvatar
            imageUri={imageMeta.imageUri}
            initials={imageMeta.initials}
            color={imageMeta.color}
            size={wp(10)}
          />
        ) : (
          <PaymentIcon
            name={meta.iconName}
            backgroundColor={selected ? theme.primary + '18' : meta.iconBg}
            color={selected ? theme.primary : meta.iconColor}
            containerSize={wp(10)}
            size={wp(5)}
          />
        )}
        <View style={styles.accountCardInfo}>
          <Label
            type="bodySmall"
            weight="semiBold"
            color={selected ? 'primary' : 'textMain'}
          >
            {account.label}
          </Label>
          {showBalance && (
            <CurrencyView
              amount={account.balance ?? 0}
              type="bodyXs"
              weight="regular"
              color={selected ? 'primary' : 'textMuted'}
            />
          )}
        </View>
        {!selected && (
          <ChevronRight
            size={wp(4)}
            color={theme.textMuted}
            strokeWidth={1.8}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior="padding"
        automaticOffset
      >
        <ScreenHeader
          title="Transfer Funds"
          onBack={() => navigation.goBack()}
          backIcon="arrow"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── From / To flow ── */}
          <View style={styles.flowSection}>
            <View
              style={[
                styles.flowCard,
                shadowCard,
                { backgroundColor: theme.surfacePrimary },
              ]}
            >
              {fromAccount ? (
                <AccountCard
                  account={fromAccount}
                  selected
                  showBalance
                  onPress={() => setPickerMode('from')}
                />
              ) : (
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => setPickerMode('from')}
                  activeOpacity={0.7}
                >
                  <Label type="bodySmall" weight="semiBold" color="primary">
                    Select source account
                  </Label>
                  <ChevronRight
                    size={wp(4)}
                    color={theme.primary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}

              <View style={styles.swapRow}>
                <View style={styles.connector} />
                <TouchableOpacity
                  style={[
                    styles.swapBtn,
                    { backgroundColor: theme.surfaceSecondary },
                  ]}
                  onPress={handleSwap}
                  activeOpacity={0.7}
                  disabled={!fromAccountId || !toAccountId}
                >
                  <ArrowDownUp
                    size={wp(4.5)}
                    color={theme.primary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
                <View style={styles.connector} />
              </View>

              {toAccount ? (
                <AccountCard
                  account={toAccount}
                  selected
                  showBalance
                  onPress={() => setPickerMode('to')}
                />
              ) : (
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => setPickerMode('to')}
                  activeOpacity={0.7}
                >
                  <Label type="bodySmall" weight="semiBold" color="primary">
                    Select destination account
                  </Label>
                  <ChevronRight
                    size={wp(4)}
                    color={theme.primary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Amount ── */}
          {fromAccountId && toAccountId && (
            <View style={styles.amountSection}>
              <View
                style={[
                  styles.amountCard,
                  { backgroundColor: theme.surfacePrimary },
                ]}
              >
                <Label
                  type="bodySmall"
                  weight="semiBold"
                  color="textMuted"
                  style={styles.amountLabel}
                >
                  AMOUNT TO TRANSFER
                </Label>
                <View style={styles.amountInputRow}>
                  <Label
                    type="displayMd"
                    weight="bold"
                    color="primary"
                    style={styles.currencySign}
                  >
                    PKR
                  </Label>
                  <AppTextInput
                    placeholder="0"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    containerStyle={styles.amountField}
                    inputStyle={styles.amountInput}
                  />
                </View>

                {fromAccount && parseFloat(amount) > 0 && (
                  <View
                    style={[
                      styles.balancePreview,
                      { backgroundColor: theme.surfaceSecondary },
                    ]}
                  >
                    <View style={styles.balanceRow}>
                      <Label type="bodyXs" weight="regular" color="textMuted">
                        {fromAccount.label}
                      </Label>
                      <View style={styles.balanceChange}>
                        <CurrencyView
                          amount={fromAccount.balance}
                          type="bodyXs"
                          weight="regular"
                          color="textMuted"
                        />
                        <Label type="bodyXs" weight="regular" color="error">
                          {' '}
                          →{' '}
                        </Label>
                        <CurrencyView
                          amount={Math.max(
                            0,
                            fromAccount.balance - parseFloat(amount),
                          )}
                          type="bodyXs"
                          weight="semiBold"
                          color="error"
                        />
                      </View>
                    </View>
                    <View style={styles.balanceRow}>
                      <Label type="bodyXs" weight="regular" color="textMuted">
                        {toAccount?.label}
                      </Label>
                      <View style={styles.balanceChange}>
                        <CurrencyView
                          amount={toAccount?.balance ?? 0}
                          type="bodyXs"
                          weight="regular"
                          color="textMuted"
                        />
                        <Label type="bodyXs" weight="regular" color="primary">
                          {' '}
                          →{' '}
                        </Label>
                        <CurrencyView
                          amount={
                            (toAccount?.balance ?? 0) + parseFloat(amount)
                          }
                          type="bodyXs"
                          weight="semiBold"
                          color="primary"
                        />
                      </View>
                    </View>
                  </View>
                )}

                <AppTextInput
                  label="Description (optional)"
                  placeholder="e.g., Monthly savings transfer"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={saving ? 'Transferring…' : 'Transfer'}
            leftIcon={
              <ArrowRightLeft
                size={wp(5)}
                color={theme.onPrimary}
                strokeWidth={2}
              />
            }
            onPress={handleTransfer}
            disabled={saving || !fromAccountId || !toAccountId || !amount}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ── Account Picker Modal ── */}
      <Modal
        visible={pickerMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerMode(null)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setPickerMode(null)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.pickerCard,
                  { backgroundColor: theme.surfacePrimary },
                ]}
              >
                <View style={styles.pickerHeader}>
                  <Label type="bodyMedium" weight="bold" color="textMain">
                    {pickerMode === 'from'
                      ? 'Source Account'
                      : 'Destination Account'}
                  </Label>
                  <TouchableOpacity
                    onPress={() => setPickerMode(null)}
                    activeOpacity={0.7}
                    style={styles.closeBtn}
                  >
                    <X size={wp(4.5)} color={theme.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.pickerList}>
                  {pickerGroups.map(group => (
                    <View key={group.type} style={styles.pickerGroup}>
                      <Label
                        type="bodyXs"
                        weight="semiBold"
                        color="textMuted"
                        style={styles.pickerGroupLabel}
                      >
                        {group.label}
                      </Label>
                      {group.items.map(account => {
                        const isSelected =
                          (pickerMode === 'from' &&
                            fromAccountId === account._id) ||
                          (pickerMode === 'to' && toAccountId === account._id);
                        const meta = getAccountTypeMeta(account.type);
                        const imageMeta = getAccountMeta(
                          account.type,
                          account.sourceId,
                        );
                        return (
                          <TouchableOpacity
                            key={account._id}
                            style={[
                              styles.pickerItem,
                              isSelected && {
                                backgroundColor: theme.primary + '10',
                              },
                              !isSelected && {
                                borderBottomWidth: 0.5,
                                borderBottomColor: theme.outlineVariant,
                              },
                            ]}
                            onPress={() => {
                              if (pickerMode === 'from') {
                                setFromAccountId(account._id);
                                if (toAccountId === account._id)
                                  setToAccountId(null);
                              } else {
                                setToAccountId(account._id);
                              }
                              setPickerMode(null);
                            }}
                            activeOpacity={0.7}
                          >
                            {imageMeta?.imageUri ? (
                              <AccountAvatar
                                imageUri={imageMeta.imageUri}
                                initials={imageMeta.initials}
                                color={imageMeta.color}
                                size={wp(10)}
                              />
                            ) : (
                              <PaymentIcon
                                name={meta.iconName}
                                backgroundColor={meta.iconBg}
                                color={meta.iconColor}
                                containerSize={wp(10)}
                                size={wp(5)}
                              />
                            )}
                            <View style={styles.pickerItemInfo}>
                              <Label
                                type="bodySmall"
                                weight="semiBold"
                                color="textMain"
                              >
                                {account.label}
                              </Label>
                              <Label
                                type="bodyXs"
                                weight="regular"
                                color="textMuted"
                              >
                                {meta.label}
                              </Label>
                            </View>
                            <CurrencyView
                              amount={account.balance ?? 0}
                              type="bodySmall"
                              weight="semiBold"
                              color="textMain"
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    scrollContent: { paddingBottom: hp(2) },

    // ── Flow section ──
    flowSection: {
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      marginBottom: hp(1.5),
    },
    flowCard: {
      borderRadius: borderRadius.xl,
      padding: wp(4),
      gap: hp(0.5),
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3),
      paddingVertical: hp(1.5),
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      gap: wp(3),
    },
    accountCardSelected: {
      backgroundColor: t.primary + '08',
    },
    accountCardInfo: { flex: 1, gap: hp(0.2) },

    selectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hp(2),
      paddingHorizontal: wp(3),
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: t.primary + '40',
      borderStyle: 'dashed',
    },

    swapRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(0.5),
      gap: wp(3),
    },
    connector: {
      flex: 1,
      height: 1,
      backgroundColor: t.outlineVariant,
    },
    swapBtn: {
      width: wp(9),
      height: wp(9),
      borderRadius: wp(4.5),
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Amount section ──
    amountSection: {
      paddingHorizontal: wp(5),
      marginBottom: hp(2),
    },
    amountCard: {
      borderRadius: borderRadius.xl,
      padding: wp(5),
      gap: hp(1.5),
    },
    amountLabel: {
      letterSpacing: 0.8,
    },
    amountInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    currencySign: {
      marginTop: hp(-1),
    },
    amountField: {
      flex: 1,
      marginBottom: 0,
    },
    amountInput: {
      fontSize: 28,
      fontWeight: '700',
    },
    balancePreview: {
      borderRadius: borderRadius.lg,
      padding: wp(3.5),
      gap: hp(1),
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balanceChange: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    // ── Footer ──
    footer: {
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      backgroundColor: t.background,
    },

    // ── Picker Modal ──
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    pickerCard: {
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      paddingTop: hp(2),
      paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(2.5),
      maxHeight: '75%',
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingBottom: hp(1.5),
      borderBottomWidth: 0.5,
      borderBottomColor: t.outlineVariant,
    },
    closeBtn: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      backgroundColor: t.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerList: {
      paddingBottom: hp(2),
    },
    pickerGroup: {
      marginTop: hp(1.5),
    },
    pickerGroupLabel: {
      paddingHorizontal: wp(5),
      letterSpacing: 0.8,
      marginBottom: hp(0.5),
    },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingVertical: hp(1.5),
      gap: wp(3),
    },
    pickerItemInfo: {
      flex: 1,
      gap: hp(0.2),
    },
  });

export default TransferScreen;
