import React, { useMemo, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Switch,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { X, TrendingUp } from 'lucide-react-native';
import { Label, borderRadius } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import AppTextInput from '../../ui/AppTextInput';
import ToggleButtons from '../../ui/ToggleButtons';
import PrimaryButton from '../../ui/PrimaryButton';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const InvestmentSetupModal = ({ visible, onClose, onConfirm, defaults }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [profitEnabled, setProfitEnabled] = useState(
    defaults?.profitEnabled ?? true,
  );
  const [profitType, setProfitType] = useState(
    defaults?.profitType ?? 'fixed',
  );
  const [profitValue, setProfitValue] = useState(
    defaults?.profitValue ?? '0',
  );
  const [frequency, setFrequency] = useState(
    defaults?.frequency ?? 'monthly',
  );
  const [returnDayMode, setReturnDayMode] = useState(
    defaults?.returnDay ? 'specific' : 'same',
  );
  const [returnDay, setReturnDay] = useState(
    defaults?.returnDay?.toString() ?? '',
  );

  const handleConfirm = () => {
    onConfirm({
      profitEnabled: !!profitEnabled,
      profitType,
      profitValue: parseFloat(profitValue) || 0,
      frequency,
      returnDay:
        frequency === 'monthly' && returnDayMode === 'specific'
          ? Math.min(31, Math.max(1, parseInt(returnDay, 10) || 1))
          : null,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <TrendingUp
                    size={wp(5.5)}
                    color={theme.primary}
                    strokeWidth={2}
                  />
                  <Label type="bodyMedium" weight="bold" color="textMain">
                    Investment Setup
                  </Label>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={styles.closeBtn}
                >
                  <X size={wp(4.5)} color={theme.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
              >
                <Label type="bodySmall" weight="regular" color="textMuted" style={styles.helper}>
                  Configure whether this investment will return profit.
                </Label>

                <View style={styles.switchRow}>
                  <Label type="bodySmall" weight="semiBold" color="textMain">
                    Returns Profit
                  </Label>
                  <Switch
                    value={profitEnabled}
                    onValueChange={setProfitEnabled}
                    trackColor={{
                      false: theme.outlineVariant,
                      true: theme.primaryContainer,
                    }}
                    thumbColor={profitEnabled ? theme.primary : theme.surfacePrimary}
                  />
                </View>

                {profitEnabled && (
                  <>
                    <View style={styles.section}>
                      <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
                        PROFIT TYPE
                      </Label>
                      <ToggleButtons
                        options={[
                          { value: 'fixed', label: 'Fixed (PKR)', color: theme.primary },
                          { value: 'percentage', label: 'Variable (%)', color: theme.primary },
                        ]}
                        activeValue={profitType}
                        onSelect={setProfitType}
                      />
                    </View>

                    <AppTextInput
                      label={profitType === 'fixed' ? 'Profit Amount (PKR)' : 'Profit Rate (%)'}
                      placeholder="0"
                      value={profitValue}
                      onChangeText={setProfitValue}
                      keyboardType="numeric"
                      leftIconName="card"
                    />

                    <View style={styles.section}>
                      <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
                        PROFIT FREQUENCY
                      </Label>
                      <ToggleButtons
                        options={FREQUENCY_OPTIONS.map(o => ({
                          ...o,
                          color: theme.primary,
                        }))}
                        activeValue={frequency}
                        onSelect={v => {
                          setFrequency(v);
                          if (v !== 'monthly') setReturnDayMode('same');
                        }}
                      />
                    </View>

                    {frequency === 'monthly' && (
                      <View style={styles.section}>
                        <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.sectionLabel}>
                          RETURN DATE
                        </Label>
                        <ToggleButtons
                          options={[
                            { value: 'same', label: 'Same day', color: theme.primary },
                            { value: 'specific', label: 'Specific day', color: theme.primary },
                          ]}
                          activeValue={returnDayMode}
                          onSelect={setReturnDayMode}
                        />
                        {returnDayMode === 'specific' && (
                          <AppTextInput
                            label="Day of month (1–31)"
                            placeholder="15"
                            value={returnDay}
                            onChangeText={t => setReturnDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                            keyboardType="numeric"
                          />
                        )}
                      </View>
                    )}

                    {parseFloat(profitValue) > 0 && (
                      <View style={styles.previewBox}>
                        <Label type="bodySmall" weight="regular" color="textMuted">
                          ~ PKR{' '}
                          {profitType === 'fixed'
                            ? parseFloat(profitValue).toLocaleString()
                            : `(${profitValue}% of principal)`}{' '}
                          every {frequency}
                        </Label>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <PrimaryButton
                  variant="primary"
                  size="lg"
                  label="Confirm"
                  onPress={handleConfirm}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = t =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: wp(5),
    },
    card: {
      width: '100%',
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.xl,
      paddingTop: hp(2.5),
      maxHeight: '85%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingBottom: hp(1.5),
      borderBottomWidth: 0.5,
      borderBottomColor: t.outlineVariant,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
    },
    closeBtn: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      backgroundColor: t.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      paddingBottom: hp(1),
      gap: hp(2),
    },
    helper: {
      lineHeight: hp(2),
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: t.surfaceSecondary,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      borderRadius: borderRadius.lg,
    },
    section: {
      gap: hp(1),
    },
    sectionLabel: {
      letterSpacing: 0.8,
    },
    previewBox: {
      backgroundColor: t.surfaceSecondary,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    footer: {
      paddingHorizontal: wp(5),
      paddingVertical: hp(2),
      borderTopWidth: 0.5,
      borderTopColor: t.outlineVariant,
    },
  });

export default InvestmentSetupModal;
