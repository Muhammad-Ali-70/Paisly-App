import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Keyboard,
  BackHandler,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Banknote, Landmark, Smartphone } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import KeyboardFormLayout from '../../components/common/KeyboardFormLayout';
import OnboardingProgress from '../../components/onboarding/OnboardingProgress';
import OnboardingStepHero from '../../components/onboarding/OnboardingStepHero';
import CashStep from '../../components/onboarding/steps/CashStep';
import AccountsStep from '../../components/onboarding/steps/AccountsStep';
import BankPickerModal from '../../components/modals/BankPickerModal';
import DigitalWalletPickerModal from '../../components/modals/DigitalWalletPickerModal';
import PrimaryButton from '../../components/ui/PrimaryButton';
import CurrencyView from '../../components/common/CurrencyView';
import { useBankAccounts } from '../../hooks/AccountSetupCard/useBankAccounts';
import { useDigitalWallets } from '../../hooks/AccountSetupCard/Usedigitalwallets';
import {
  buildSeedAccounts,
  isValidBalanceInput,
  totalBalance,
} from '../../utils/onboardingAccounts';
import useAuthStore from '../../store/useAuthStore';
import useAccountStore from '../../store/useAccountStore';
import { seedAccountsApi } from '../../services/accountService';
import { useToastService } from '../../utils/ToastService';

// `tint` is a theme token so the step colors follow light/dark mode.
const STEPS = [
  {
    key: 'cash',
    icon: Banknote,
    tint: 'walletCash',
    title: 'How much cash do you have?',
    subtitle:
      "Money in your wallet or at home. Enter 0 if you don't carry any.",
  },
  {
    key: 'banks',
    icon: Landmark,
    tint: 'bankAccount',
    title: 'Add your bank accounts',
    subtitle:
      "Pick the banks you use and set today's balance for each. You can add more later.",
  },
  {
    key: 'wallets',
    icon: Smartphone,
    tint: 'savings',
    title: 'Any wallet apps?',
    subtitle:
      "JazzCash, Easypaisa and other apps you keep money in. Skip this if you don't use any.",
  },
];

const OnboardingScreen = () => {
  const setOnboarded = useAuthStore(s => s.setOnboarded);
  const fetchAccounts = useAccountStore(s => s.fetchAccounts);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();

  const [step, setStep] = useState(0);
  const [cash, setCash] = useState('');
  const [saving, setSaving] = useState(false);
  // Which way the next step slides in (1 = forward, -1 = back)
  const direction = useRef(1);

  // Held here (not in the steps) so entries survive moving between steps
  const banks = useBankAccounts();
  const wallets = useDigitalWallets();

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const total = totalBalance({
    cash,
    banks: banks.accounts,
    wallets: wallets.accounts,
  });

  const goTo = useCallback(
    next => {
      Keyboard.dismiss();
      direction.current = next > step ? 1 : -1;
      setStep(next);
    },
    [step],
  );

  // Hardware back walks back through the steps; on the first step it falls
  // through to the system (leaves the app). Blocked while saving.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (saving) return true;
        if (step === 0) return false;
        goTo(step - 1);
        return true;
      },
    );
    return () => subscription.remove();
  }, [step, saving, goTo]);

  const handleFinish = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const accounts = buildSeedAccounts({
        cash,
        banks: banks.accounts,
        wallets: wallets.accounts,
      });
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
    cash,
    banks.accounts,
    wallets.accounts,
    fetchAccounts,
    setOnboarded,
    toast,
  ]);

  const handlePrimary = () => (isLast ? handleFinish() : goTo(step + 1));

  const skipCash = () => {
    setCash('0');
    goTo(1);
  };

  const accountsEmpty =
    (step === 1 && banks.accounts.length === 0) ||
    (step === 2 && wallets.accounts.length === 0);
  // On the optional steps the main button becomes "Skip" until something is added
  const skipsStep = !isLast && accountsEmpty;

  const primaryLabel = saving
    ? 'Saving…'
    : isLast
    ? 'Finish setup'
    : skipsStep
    ? 'Skip for now'
    : 'Continue';

  const primaryDisabled = saving || (step === 0 && !isValidBalanceInput(cash));

  const footer = (
    <View style={styles.footer}>
      <View style={styles.totalRow}>
        <Label type="bodySmall" weight="regular" color="textMuted">
          Total balance
        </Label>
        <CurrencyView
          amount={total}
          type="body"
          weight="bold"
          color="primary"
        />
      </View>

      <PrimaryButton
        variant={skipsStep ? 'outline' : 'primary'}
        size="lg"
        label={primaryLabel}
        onPress={handlePrimary}
        disabled={primaryDisabled}
        loading={saving}
      />

      {step === 0 && (
        <TouchableOpacity
          onPress={skipCash}
          activeOpacity={0.7}
          style={styles.secondary}
        >
          <Label type="bodySmall" weight="semiBold" color="textMuted">
            I don't carry cash
          </Label>
        </TouchableOpacity>
      )}
    </View>
  );

  const enter = (direction.current >= 0 ? FadeInRight : FadeInLeft).duration(
    260,
  );

  return (
    <>
      <KeyboardFormLayout
        header={
          <OnboardingProgress
            step={step}
            total={STEPS.length}
            onBack={() => goTo(step - 1)}
          />
        }
        footer={footer}
        contentContainerStyle={styles.content}
      >
        <Animated.View key={current.key} entering={enter}>
          <OnboardingStepHero
            icon={current.icon}
            tint={theme[current.tint]}
            title={current.title}
            subtitle={current.subtitle}
          />

          {step === 0 && <CashStep value={cash} onChange={setCash} />}

          {step === 1 && (
            <AccountsStep
              type="bank"
              accounts={banks.accounts}
              onAdd={() => banks.setAddModalVisible(true)}
              onRemove={acct => banks.removeBank(acct.bankId)}
              onBalanceChange={(acct, text) =>
                banks.updateBalance(acct.bankId, text)
              }
              emptyTitle="Add a bank account"
              emptyHint="Choose from popular banks. Optional."
              addLabel="Add another bank"
            />
          )}

          {step === 2 && (
            <AccountsStep
              type="digitalWallet"
              accounts={wallets.accounts}
              onAdd={() => wallets.setAddModalVisible(true)}
              onRemove={acct => wallets.removeWallet(acct.appId)}
              onBalanceChange={(acct, text) =>
                wallets.updateBalance(acct.appId, text)
              }
              emptyTitle="Add a wallet app"
              emptyHint="JazzCash, Easypaisa and more. Optional."
              addLabel="Add another wallet"
            />
          )}
        </Animated.View>
      </KeyboardFormLayout>

      <BankPickerModal
        visible={banks.addModalVisible}
        activeId={null}
        usedIds={banks.usedIds}
        onSelect={banks.addExtraBank}
        onClose={() => banks.setAddModalVisible(false)}
      />
      <DigitalWalletPickerModal
        visible={wallets.addModalVisible}
        activeId={null}
        usedIds={wallets.usedIds}
        onSelect={wallets.addExtraWallet}
        onClose={() => wallets.setAddModalVisible(false)}
      />
    </>
  );
};

const createStyles = t =>
  StyleSheet.create({
    content: {
      paddingBottom: hp(3),
    },
    footer: {
      paddingHorizontal: wp(5),
      paddingTop: hp(1.5),
      paddingBottom: hp(2),
      gap: hp(1.2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.outlineVariant,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    secondary: {
      alignItems: 'center',
      paddingVertical: hp(0.6),
    },
  });

export default OnboardingScreen;
