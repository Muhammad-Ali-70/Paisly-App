import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import OnboardingHeader from '../../components/onboarding/Onboardingheader';
import OnboardingTagline from '../../components/onboarding/Onboardingtagline';
import SectionDivider from '../../components/onboarding/Sectiondivider';
import AccountSetupCard from '../../components/onboarding/AccountSetupCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { ACCOUNT_CONFIG } from '../../constants/onboarding/initialConfig';
import useAuthStore from '../../store/useAuthStore';
import useAccountStore from '../../store/useAccountStore';
import { seedAccountsApi } from '../../services/accountService';
import { useToastService } from '../../utils/ToastService';

const OnboardingScreen = () => {
  const setOnboarded = useAuthStore(s => s.setOnboarded);
  const fetchAccounts = useAccountStore(s => s.fetchAccounts);

  const [walletBalance, setWalletBalance] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [digitalWallets, setDigitalWallets] = useState([]);
  const [saving, setSaving] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();

  const handleGetStarted = useCallback(async () => {
    if (saving || !walletBalance) return;
    setSaving(true);
    try {
      const accounts = [
        {
          type: 'wallet',
          label: 'Wallet Cash',
          color: '#10B981',
          initials: 'WC',
          balance: Number(walletBalance),
          isPrimary: true,
          sortOrder: 0,
        },
        ...bankAccounts.map((acct, idx) => ({
          type: 'bank',
          sourceId: acct.id === 'other' ? null : acct.id,
          label: acct.label,
          color: acct.color,
          initials: acct.initials,
          balance: Number(acct.balance),
          isPrimary: idx === 0,
          sortOrder: 10 + idx,
        })),
        ...digitalWallets.map((acct, idx) => ({
          type: 'digitalWallet',
          sourceId: acct.id === 'other' ? null : acct.id,
          label: acct.label,
          color: acct.color,
          initials: acct.initials,
          balance: Number(acct.balance),
          isPrimary: idx === 0,
          sortOrder: 20 + idx,
        })),
      ];

      await seedAccountsApi({ accounts });

      await fetchAccounts();
      setOnboarded();
    } catch (e) {
      console.error('Onboarding save failed:', e);
      toast.error('Failed to save accounts. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    walletBalance,
    bankAccounts,
    digitalWallets,
    fetchAccounts,
    setOnboarded,
    toast,
  ]);

  // const handleSkip = useCallback(async () => {
  //   setOnboarded();
  // }, [setOnboarded]);

  return (
    <View style={styles.safe}>
      <OnboardingHeader showSkip={false} />

      <KeyboardAwareScrollView
        bottomOffset={hp(3)}
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingTagline
          title="Master your money"
          subtitle="The effortless way to track expenses and achieve your savings goals."
        />

        <SectionDivider label="INITIAL SETUP" />

        {ACCOUNT_CONFIG.map(account => (
          <AccountSetupCard
            key={account.id}
            iconName={account.iconName}
            iconColor={account.iconColor}
            iconBg={account.iconBg}
            name={account.name}
            description={account.description}
            accountType={account.accountType}
            value={walletBalance}
            onChangeText={setWalletBalance}
            onAccountsChange={
              account.accountType === 'bank'
                ? setBankAccounts
                : account.accountType === 'digitalWallet'
                ? setDigitalWallets
                : undefined
            }
          />
        ))}

        <View style={styles.cta}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={saving ? 'Saving…' : 'Get Started'}
            onPress={handleGetStarted}
            disabled={saving || !walletBalance}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.surfacePrimary },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: hp(3) },
  cta: { paddingHorizontal: wp(5), marginTop: hp(3) },
});

export default OnboardingScreen;
