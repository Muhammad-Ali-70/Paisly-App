import React, { useMemo } from 'react';
import {
  View,
  Switch,
  StyleSheet,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useThemeColors } from '@hooks/useThemeColors';
import { useNavigation } from '@react-navigation/native';
import { hp, wp } from '../../../constants/responsive';
import { Label, borderRadius } from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import ToggleButtons from '../../../components/ui/ToggleButtons';
import AppTextInput from '../../../components/ui/AppTextInput';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import useAppStore from '../../../store/useAppStore';
import { useToastService } from '../../../utils/ToastService';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const InvestmentSettingsScreen = () => {
  const theme = useThemeColors();
  const navigation = useNavigation();
  const toast = useToastService();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const defaults = useAppStore(s => s.investmentDefaults);
  const setInvestmentDefaults = useAppStore(s => s.setInvestmentDefaults);

  const handleSave = () => {
    toast.success('Investment settings saved');
    navigation.goBack();
  };

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Investment Settings"
        onBack={() => navigation.goBack()}
        backIcon="arrow"
      />

      <KeyboardAwareScrollView
        bottomOffset={hp(3)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Label type="bodySmall" weight="semiBold" color="textMain">
                Returns Profit by Default
              </Label>
              <Label type="bodyXs" weight="regular" color="textMuted">
                When creating an investment, this is the default toggle state
              </Label>
            </View>
            <Switch
              value={defaults.profitEnabled}
              onValueChange={v => setInvestmentDefaults({ profitEnabled: v })}
              trackColor={{
                false: theme.outlineVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={defaults.profitEnabled ? theme.primary : theme.surfacePrimary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
            DEFAULT PROFIT TYPE
          </Label>
          <ToggleButtons
            options={[
              { value: 'fixed', label: 'Fixed (PKR)', color: theme.primary },
              { value: 'percentage', label: 'Variable (%)', color: theme.primary },
            ]}
            activeValue={defaults.profitType}
            onSelect={v => setInvestmentDefaults({ profitType: v })}
          />
        </View>

        <AppTextInput
          label={defaults.profitType === 'fixed' ? 'Default Profit Amount (PKR)' : 'Default Profit Rate (%)'}
          placeholder="0"
          value={String(defaults.profitValue)}
          onChangeText={v => setInvestmentDefaults({ profitValue: v })}
          keyboardType="numeric"
          leftIconName="card"
        />

        <View style={styles.section}>
          <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
            DEFAULT FREQUENCY
          </Label>
          <ToggleButtons
            options={FREQUENCY_OPTIONS.map(o => ({ ...o, color: theme.primary }))}
            activeValue={defaults.frequency}
            onSelect={v => setInvestmentDefaults({ frequency: v })}
          />
        </View>

        <View style={styles.section}>
          <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
            DEFAULT RETURN DATE
          </Label>
          <ToggleButtons
            options={[
              { value: 'same', label: 'Same day', color: theme.primary },
              { value: 'specific', label: 'Specific day', color: theme.primary },
            ]}
            activeValue={defaults.returnDay ? 'specific' : 'same'}
            onSelect={v =>
              setInvestmentDefaults({
                returnDay: v === 'specific' ? 15 : null,
              })
            }
          />
          {defaults.returnDay && (
            <AppTextInput
              label="Day of month (1–31)"
              placeholder="15"
              value={String(defaults.returnDay)}
              onChangeText={t => {
                const cleaned = t.replace(/[^0-9]/g, '').slice(0, 2);
                const num = parseInt(cleaned, 10);
                setInvestmentDefaults({
                  returnDay: num >= 1 && num <= 31 ? num : 1,
                });
              }}
              keyboardType="numeric"
            />
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label="Save Settings"
            onPress={handleSave}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    scrollContent: { paddingHorizontal: wp(5), paddingTop: hp(2), paddingBottom: hp(12) },
    section: { marginBottom: hp(2.5) },
    sectionLabel: { letterSpacing: 0.8, marginBottom: hp(1) },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: t.surfacePrimary,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.8),
      borderRadius: borderRadius.xl,
      gap: wp(3),
    },
    switchText: { flex: 1, gap: hp(0.3) },
    footer: { marginTop: hp(3) },
  });

export default InvestmentSettingsScreen;
