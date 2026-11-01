import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import ScreenHeader from '../../../components/common/Screenheader';
import AccountCard from '../../../components/accounts/AccountCard';
import EmptyAccountsState from '../../../components/accounts/EmptyAccountsState';
import AddAccountModal from '../../../components/modals/accounts/AddAccountModal';
import EditAccountModal from '../../../components/modals/accounts/EditAccountModal';
import DeleteAccountModal from '../../../components/modals/accounts/DeleteAccountModal';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { Label } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import useAccountStore from '../../../store/useAccountStore';
import useAuthStore from '../../../store/useAuthStore';
import { useToastService } from '../../../utils/ToastService';

const ManageAccountsScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();

  const accounts = useAccountStore(s => s.accounts);
  const loading = useAccountStore(s => s.loading);
  const fetchAccounts = useAccountStore(s => s.fetchAccounts);
  const updateAccount = useAccountStore(s => s.updateAccount);
  const archiveAccount = useAccountStore(s => s.archiveAccount);
  
  const setOnboarded = useAuthStore(s => s.setOnboarded);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setEditModalVisible(true);
  };

  const handleDelete = (account) => {
    setSelectedAccount(account);
    setDeleteModalVisible(true);
  };

  const handleSaveEdit = async (data) => {
    const result = await updateAccount(selectedAccount._id, data);
    if (result.success) {
      toast.success('Account updated successfully');
      setEditModalVisible(false);
      setSelectedAccount(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleConfirmDelete = async () => {
    const result = await archiveAccount(selectedAccount._id);
    if (result.success) {
      if (result.newPrimaryLabel) {
        toast.success(`Account archived. ${result.newPrimaryLabel} is now primary`);
      } else {
        toast.success('Account archived successfully');
      }
      setDeleteModalVisible(false);
      setSelectedAccount(null);
    } else {
      toast.error(result.message);
    }
  };

  const handleGetStarted = () => {
    setOnboarded(false);
  };

  const groupedAccounts = {
    wallet: accounts.filter(a => a.type === 'wallet'),
    bank: accounts.filter(a => a.type === 'bank'),
    digitalWallet: accounts.filter(a => a.type === 'digitalWallet'),
  };

  const canAddBanks = groupedAccounts.bank.length < 5;
  const canAddWallets = groupedAccounts.digitalWallet.length < 5;

  if (loading && accounts.length === 0) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Manage Accounts" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (accounts.length === 0) {
    return (
      <View style={styles.safe}>
        <ScreenHeader title="Manage Accounts" onBack={() => navigation.goBack()} />
        <EmptyAccountsState onGetStarted={handleGetStarted} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Manage Accounts" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {(canAddBanks || canAddWallets) && (
          <View style={styles.addSection}>
            <PrimaryButton
              variant="outline"
              size="md"
              label="Add Account"
              leftIcon={<Plus size={wp(4.5)} color={theme.primary} />}
              onPress={() => setAddModalVisible(true)}
            />
          </View>
        )}

        {groupedAccounts.wallet.length > 0 && (
          <View style={styles.section}>
            <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
              WALLET
            </Label>
            <View style={styles.sectionContent}>
              {groupedAccounts.wallet.map((account, idx) => (
                <AccountCard
                  key={account._id}
                  account={account}
                  onEdit={() => handleEdit(account)}
                  onDelete={() => handleDelete(account)}
                  isLast={idx === groupedAccounts.wallet.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {groupedAccounts.bank.length > 0 && (
          <View style={styles.section}>
            <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
              BANK ACCOUNTS ({groupedAccounts.bank.length}/5)
            </Label>
            <View style={styles.sectionContent}>
              {groupedAccounts.bank.map((account, idx) => (
                <AccountCard
                  key={account._id}
                  account={account}
                  onEdit={() => handleEdit(account)}
                  onDelete={() => handleDelete(account)}
                  isLast={idx === groupedAccounts.bank.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {groupedAccounts.digitalWallet.length > 0 && (
          <View style={styles.section}>
            <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
              DIGITAL WALLETS ({groupedAccounts.digitalWallet.length}/5)
            </Label>
            <View style={styles.sectionContent}>
              {groupedAccounts.digitalWallet.map((account, idx) => (
                <AccountCard
                  key={account._id}
                  account={account}
                  onEdit={() => handleEdit(account)}
                  onDelete={() => handleDelete(account)}
                  isLast={idx === groupedAccounts.digitalWallet.length - 1}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <AddAccountModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />

      <EditAccountModal
        visible={editModalVisible}
        account={selectedAccount}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedAccount(null);
        }}
        onSave={handleSaveEdit}
      />

      <DeleteAccountModal
        visible={deleteModalVisible}
        account={selectedAccount}
        transactionCount={0}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedAccount(null);
        }}
      />
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: t.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: hp(3),
  },
  addSection: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  section: {
    marginTop: hp(2),
  },
  sectionLabel: {
    paddingHorizontal: wp(5),
    marginBottom: hp(1),
    letterSpacing: 0.6,
  },
  sectionContent: {
    backgroundColor: t.surfacePrimary,
    paddingHorizontal: wp(5),
  },
});

export default ManageAccountsScreen;
