import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet from '../../ui/BottomSheet';
import AppTextInput from '../../ui/AppTextInput';
import PrimaryButton from '../../ui/PrimaryButton';
import PaymentSourcePicker from '../../addexpense/PaymentSourcePicker';
import PaymentSourceModal from '../PaymentSourceModal';
import { Label } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { useRecordDebtPayment } from '../../../queries/debts';
import { useToastService } from '../../../utils/ToastService';

// "outstanding" = the user owes the counterparty (money goes out);
// "receivable" = the counterparty owes the user (money comes in).
const RecordDebtPaymentModal = ({ visible, debt, onClose }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();
  const recordPayment = useRecordDebtPayment();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  // Guards a double tap before isPending re-renders the button
  const submitting = useRef(false);

  const remaining = debt?.remainingAmount ?? 0;
  const isPayable = debt?.debtType === 'outstanding';

  useEffect(() => {
    if (!visible || !debt) return;
    setAmount(String(remaining));
    setNote('');
    setAccountId(debt.sourceAccountId?._id ?? debt.sourceAccountId ?? null);
  }, [visible, debt, remaining]);

  const parsed = parseFloat(amount);
  const amountError =
    amount && (!(parsed > 0) || parsed > remaining)
      ? `Enter an amount up to PKR ${remaining.toLocaleString()}`
      : null;
  const canSubmit = parsed > 0 && parsed <= remaining && !!accountId;

  const handleSubmit = () => {
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    recordPayment.mutate(
      { id: debt._id, paymentAmount: parsed, accountId, note: note.trim() },
      {
        onSuccess: () => {
          toast.success(
            parsed >= remaining
              ? 'Debt settled!'
              : isPayable
              ? 'Payment recorded'
              : 'Money received recorded',
          );
          onClose();
        },
        onError: err =>
          toast.error(err?.message || 'Could not record the payment. Please try again.'),
        onSettled: () => {
          submitting.current = false;
        },
      },
    );
  };

  const saving = recordPayment.isPending;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isPayable ? 'Record Payment' : 'Record Money Received'}
    >
      <View style={styles.content}>
        <Label type="bodyXs" weight="regular" color="textMuted" style={styles.hint}>
          {isPayable
            ? `You owe ${debt?.counterpartyName}: PKR ${remaining.toLocaleString()} remaining`
            : `${debt?.counterpartyName} owes you: PKR ${remaining.toLocaleString()} remaining`}
        </Label>

        <AppTextInput
          label="Amount"
          placeholder="0"
          value={amount}
          onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          leftIconName="card"
          error={amountError}
        />
        {parsed !== remaining && (
          <TouchableOpacity onPress={() => setAmount(String(remaining))} activeOpacity={0.7}>
            <Label type="bodySmall" weight="semiBold" color="primary" style={styles.fullAmount}>
              Use full amount (settles the debt)
            </Label>
          </TouchableOpacity>
        )}

        <PaymentSourcePicker
          activeId={accountId}
          onSelect={setAccountId}
          onSeeAll={() => setSourceModalVisible(true)}
        />

        <AppTextInput
          label="Note (Optional)"
          placeholder="e.g., Paid via JazzCash"
          value={note}
          onChangeText={setNote}
          maxLength={200}
        />

        <View style={styles.footer}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={
              saving
                ? 'Saving…'
                : parsed >= remaining
                ? 'Record & Settle'
                : 'Record Payment'
            }
            onPress={handleSubmit}
            disabled={saving || !canSubmit}
          />
        </View>
      </View>

      <PaymentSourceModal
        visible={sourceModalVisible}
        activeId={accountId}
        onSelect={setAccountId}
        onClose={() => setSourceModalVisible(false)}
      />
    </BottomSheet>
  );
};

const createStyles = () =>
  StyleSheet.create({
    content: {
      paddingHorizontal: wp(5),
      paddingBottom: hp(1),
      gap: hp(0.5),
    },
    hint: {
      marginBottom: hp(1),
    },
    fullAmount: {
      marginBottom: hp(1),
    },
    footer: {
      marginTop: hp(2),
    },
  });

export default RecordDebtPaymentModal;
