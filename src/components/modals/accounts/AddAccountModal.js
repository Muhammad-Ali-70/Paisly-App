import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import BottomSheet from '../../ui/BottomSheet';
import BankCard from '../../onboarding/AccountSetupCard/BankCard';
import DailyPayCard from '../../onboarding/AccountSetupCard/DailyPayCard';
import PrimaryButton from '../../ui/PrimaryButton';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { createAccountApi } from '../../../services/accountService';
import { useToastService } from '../../../utils/ToastService';
import useAccountStore from '../../../store/useAccountStore';

const AddAccountModal = ({ visible, onClose }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();
  const fetchAccounts = useAccountStore(s => s.fetchAccounts);

  const [accountType, setAccountType] = useState('bank');
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setAccounts([]);
    setAccountType('bank');
    onClose();
  };

  const handleSave = async () => {
    if (accounts.length === 0) {
      toast.warning('Please add at least one account');
      return;
    }

    setSaving(true);
    try {
      // allSettled, not all: when one fails the others are already created on
      // the server, so they leave the form and a retry only resends the failures
      // (retrying everything would duplicate the ones that worked).
      const results = await Promise.allSettled(
        accounts.map((acct, idx) =>
          createAccountApi({
            type: accountType,
            sourceId: acct.id === 'other' ? null : acct.id,
            label: acct.label,
            color: acct.color,
            initials: acct.initials,
            balance: Number(acct.balance) || 0,
            isPrimary: false,
            sortOrder: 999 + idx,
          }),
        ),
      );

      const failed = accounts.filter((_, idx) => results[idx].status === 'rejected');
      const added = accounts.length - failed.length;
      if (added > 0) await fetchAccounts();

      if (failed.length === 0) {
        toast.success(`${added} account${added > 1 ? 's' : ''} added successfully`);
        handleClose();
        return;
      }

      setAccounts(failed);
      const firstError = results.find(r => r.status === 'rejected').reason;
      const reason = firstError?.message || 'Please try again.';
      toast.error(
        added > 0
          ? `${added} added. Couldn't add ${failed.map(a => a.label).join(', ')}: ${reason}`
          : reason,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Add Accounts">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.typeSelector}>
          <PrimaryButton
            variant={accountType === 'bank' ? 'primary' : 'outline'}
            size="sm"
            label="Bank Account"
            onPress={() => {
              setAccountType('bank');
              setAccounts([]);
            }}
            style={styles.typeBtn}
          />
          <PrimaryButton
            variant={accountType === 'digitalWallet' ? 'primary' : 'outline'}
            size="sm"
            label="Digital Wallet"
            onPress={() => {
              setAccountType('digitalWallet');
              setAccounts([]);
            }}
            style={styles.typeBtn}
          />
        </View>

        {accountType === 'bank' ? (
          <BankCard
            name="Bank Accounts"
            description="Add up to 5 bank accounts"
            iconName="bank"
            iconColor="#3B82F6"
            iconBg="#EFF6FF"
            onAccountsChange={setAccounts}
          />
        ) : (
          <DailyPayCard
            name="Digital Wallets"
            description="Add up to 5 digital wallets"
            iconName="dollar"
            iconColor="#8B5CF6"
            iconBg="#F5F3FF"
            onAccountsChange={setAccounts}
          />
        )}

        <View style={styles.footer}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={saving ? 'Adding…' : `Add ${accounts.length || ''} Account${accounts.length !== 1 ? 's' : ''}`}
            onPress={handleSave}
            disabled={saving || accounts.length === 0}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const createStyles = t => StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  typeSelector: {
    flexDirection: 'row',
    gap: wp(2),
    marginBottom: hp(2),
  },
  typeBtn: {
    flex: 1,
  },
  footer: {
    marginTop: hp(3),
  },
});

export default AddAccountModal;
