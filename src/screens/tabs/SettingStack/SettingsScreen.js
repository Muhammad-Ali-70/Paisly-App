import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import HomeHeader from '../../../components/home/HomeHeader';
import SettingsProfileCard from '../../../components/settings/SettingsProfileCard';
import SettingsSection from '../../../components/settings/SettingsSection';
import SettingsRow from '../../../components/settings/SettingsRow';
import { Label, borderRadius } from '../../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../../constants/responsive';
import { useNavigation } from '@react-navigation/native';
import SignOutButton from '../../../components/settings/SignOutButton';
import DeleteUserModal from '../../../components/settings/DeleteUserModal';
import PaydayModal, { ordinal } from '../../../components/modals/PaydayModal';
import { useToastService } from '../../../utils/ToastService';
import { LINKS } from '../../../constants/links';
// import ExportModal from '../../../components/modals/export/ExportModal'; // TODO(post-MVP)
import { useAccounts } from '../../../database/hooks/useAccounts';
import useAppStore from '@store/useAppStore';
import { formatReminderTime } from './RemindersScreen';
import useAuthStore, { selectDisplayName } from '../../../store/useAuthStore';

const TYPE_LABEL = {
  wallet: 'Wallet',
  bank: 'Bank',
  digitalWallet: 'Digital Wallet',
};

const AccountRow = ({ account, isLast, tc }) => (
  <View
    style={[
      styles.accountRow,
      !isLast && {
        borderBottomWidth: 0.5,
        borderBottomColor: tc.outlineVariant,
      },
    ]}
  >
    <View style={[styles.accountDot, { backgroundColor: account.color }]} />
    <View style={styles.accountInfo}>
      <Label type="bodySmall" weight="semiBold" color="textMain">
        {account.label}
      </Label>
      <Label type="bodyXs" weight="regular" color="textMuted">
        {TYPE_LABEL[account.type] ?? account.type}
        {account.isPrimary ? ' · primary' : ''}
      </Label>
    </View>
    <Label type="bodySmall" weight="semiBold" color="textMain">
      PKR {account.balance?.toLocaleString() ?? '0'}
    </Label>
  </View>
);

const SettingsScreen = () => {
  // TODO(post-MVP): restore with Export Transactions / Dark Mode
  // const [exportModalVisible, setExportModalVisible] = useState(false);
  const user = useAuthStore(s => s.user);
  const displayName = useAuthStore(selectDisplayName);
  const { accounts, loading, totalBalance } = useAccounts();
  // const theme = useAppStore(s => s.theme);
  // const toggleTheme = useAppStore(s => s.toggleTheme);
  const reminders = useAppStore(s => s.reminders);
  const paydayDay = useAppStore(s => s.paydayDay);
  const setPaydayDay = useAppStore(s => s.setPaydayDay);
  const [paydayVisible, setPaydayVisible] = useState(false);
  const logout = useAuthStore(s => s.logout);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const toast = useToastService();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // const darkMode = theme === 'dark';
  const themeColors = useThemeColors();

  const navigation = useNavigation();

  const email = user?.email ?? '';
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  // On success the store logs out and the navigator drops back to the auth flow.
  const handleDeleteAccount = async password => {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount({ password });
    setDeleting(false);
    if (result.cancelled) return; // closed the Google picker: keep the modal open, no error
    if (result.success) {
      toast.success('Your account has been deleted');
    } else {
      setDeleteError(result.message);
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <HomeHeader onBellPress={() => navigation.navigate('Notifications')} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SettingsProfileCard
          name={displayName}
          email={email}
          isPremium={false}
          isGoogleLinked={!!user?.isGoogleLinked}
          avatarUrl={user?.avatar}
          onEditPress={() => navigation.navigate('EditProfile')}
        />

        {/* ── Money Tools ── */}
        <SettingsSection title="MONEY TOOLS">
          <SettingsRow
            iconName="calculator"
            title="Debt Calculator"
            subtitle="Manage your debts and loans"
            onPress={() => navigation.navigate('DebtScreen')}
            showDivider
          />
          <SettingsRow
            iconName="repeat"
            title="Recurring Bills"
            subtitle="Rent, utilities, salary and more"
            onPress={() => navigation.navigate('RecurringBills')}
            showDivider
          />
          <SettingsRow
            iconName="currency"
            title="Payday"
            subtitle="Used for your safe-to-spend number"
            rightLabel={paydayDay ? ordinal(paydayDay) : 'Month end'}
            onPress={() => setPaydayVisible(true)}
            showDivider
          />
          {/* TODO(post-MVP): re-enable Investments
          <SettingsRow
            iconName="trendingup"
            title="Investments"
            subtitle="Track your investment returns"
            onPress={() => navigation.navigate('InvestmentsScreen')}
            showDivider
          />
          */}
          <SettingsRow
            iconName="transfer"
            title="Transfer Funds"
            subtitle="Move money between accounts"
            onPress={() => navigation.navigate('TransferScreen')}
            showDivider={false}
          />
          {/* TODO(post-MVP): re-enable Dark Mode and Default Currency
          <SettingsRow
            iconName="moon"
            title="Dark Mode"
            subtitle="Adjust system appearance"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={toggleTheme}
                trackColor={{
                  false: themeColors.outlineVariant,
                  true: themeColors.primaryContainer,
                }}
                thumbColor={themeColors.surfacePrimary}
              />
            }
            onPress={toggleTheme}
            showDivider
          />
          <SettingsRow
            iconName="currency"
            title="Default Currency"
            subtitle="Set your primary currency"
            rightLabel="PKR"
            onPress={() => {}}
            showDivider={false}
          />
          */}
        </SettingsSection>

        {/* TODO(post-MVP): re-enable System & Data (Notifications, Export Transactions)
        <SettingsSection title="SYSTEM & DATA">
          <SettingsRow
            iconName="bell"
            title="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            showDivider
          />
          <SettingsRow
            iconName="upload"
            title="Export Transactions"
            onPress={() => setExportModalVisible(true)}
            showDivider={false}
          />
        </SettingsSection>
        */}

        {/* ── Reminders ── */}
        <SettingsSection title="REMINDERS">
          <SettingsRow
            iconName="bell"
            title="Reminders"
            subtitle={
              reminders.dailyEnabled
                ? `Daily at ${formatReminderTime(
                    reminders.dailyHour,
                    reminders.dailyMinute,
                  )}`
                : 'Daily spending and debt due dates'
            }
            onPress={() => navigation.navigate('Reminders')}
            showDivider={false}
          />
        </SettingsSection>

        {/* ── Accounts ── */}
        <SettingsSection title="ACCOUNTS">
          <SettingsRow
            iconName="settings"
            title="Manage Accounts"
            subtitle="Add, edit, or remove accounts"
            onPress={() => navigation.navigate('ManageAccounts')}
            showDivider
          />
          {loading ? (
            <View style={styles.loadingRow}>
              <Label type="bodySmall" weight="regular" color="textMuted">
                Loading…
              </Label>
            </View>
          ) : accounts.length === 0 ? (
            <View style={styles.loadingRow}>
              <Label type="bodySmall" weight="regular" color="textMuted">
                No accounts found.
              </Label>
            </View>
          ) : (
            <>
              {accounts.map((account, idx) => (
                <AccountRow
                  key={account._id || account.id}
                  account={account}
                  isLast={idx === accounts.length - 1}
                  tc={themeColors}
                />
              ))}

              {/* Total balance footer */}
              <View
                style={[
                  styles.totalRow,
                  { borderTopColor: themeColors.outlineVariant },
                ]}
              >
                <Label type="bodyXs" weight="regular" color="textMuted">
                  Total Balance
                </Label>
                <Label type="bodyMedium" weight="bold" color="primary">
                  PKR {totalBalance.toLocaleString()}
                </Label>
              </View>
            </>
          )}
        </SettingsSection>

        <SettingsSection title="ABOUT">
          <SettingsRow
            iconName="help"
            title="Help & Support"
            onPress={() => Linking.openURL(LINKS.support)}
            showDivider
          />
          <SettingsRow
            iconName="shield"
            title="Privacy Policy"
            onPress={() => Linking.openURL(LINKS.privacy)}
            showDivider
          />
          <SettingsRow
            iconName="shield"
            title="Terms of Service"
            onPress={() => Linking.openURL(LINKS.terms)}
            showDivider={false}
          />
        </SettingsSection>

        {/* ── Danger zone ── */}

        <SignOutButton onPress={handleSignOut} />

        <TouchableOpacity
          onPress={() => setDeleteVisible(true)}
          activeOpacity={0.6}
          style={styles.deleteLink}
        >
          <Label type="bodySmall" weight="semiBold" color="error">
            Delete Account
          </Label>
        </TouchableOpacity>

        <Label
          type="bodyXs"
          weight="regular"
          color="textMuted"
          style={styles.version}
        >
          Paisly v{DeviceInfo.getVersion()} (Build {DeviceInfo.getBuildNumber()})
        </Label>
      </ScrollView>

      <PaydayModal
        visible={paydayVisible}
        onClose={() => setPaydayVisible(false)}
        value={paydayDay}
        onSelect={setPaydayDay}
      />
      <DeleteUserModal
        visible={deleteVisible}
        loading={deleting}
        error={deleteError}
        usesGoogle={user?.hasPassword === false}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setDeleteVisible(false);
          setDeleteError(null);
        }}
      />

      {/* TODO(post-MVP): re-enable with Export Transactions
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      />
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(12),
  },

  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    gap: wp(3),
  },
  accountDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
  },
  accountInfo: {
    flex: 1,
    gap: hp(0.3),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderTopWidth: 0.5,
  },
  loadingRow: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },

  deleteLink: {
    alignSelf: 'center',
    marginTop: hp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
  },
  version: {
    textAlign: 'center',
    marginTop: hp(1),
  },
});

export default SettingsScreen;
