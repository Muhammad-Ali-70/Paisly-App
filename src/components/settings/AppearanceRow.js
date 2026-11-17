import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Label, borderRadius } from '../../constants/globalstyle';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import useAppStore from '@store/useAppStore';
import SettingsRow from './SettingsRow';

const OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Theme picker: follows the phone by default, user can force light or dark. */
const AppearanceRow = () => {
  const tc = useThemeColors();
  const mode = useAppStore(s => s.themeMode);
  const setThemeMode = useAppStore(s => s.setThemeMode);

  return (
    <View>
      <SettingsRow
        iconName="moon"
        title="Appearance"
        subtitle={mode === 'system' ? 'Matches your phone' : 'Set manually'}
        showDivider={false}
      />
      <View style={[styles.track, { backgroundColor: tc.surfaceSecondary }]}>
        {OPTIONS.map(opt => {
          const active = opt.value === mode;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.segment,
                active && { backgroundColor: tc.primary },
              ]}
              activeOpacity={0.8}
              onPress={() => setThemeMode(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${opt.label} theme`}
            >
              <Label
                type="bodySmall"
                weight="semiBold"
                color={active ? 'onPrimary' : 'textMuted'}
              >
                {opt.label}
              </Label>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
    padding: wp(1),
    borderRadius: borderRadius.lg,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1),
    borderRadius: borderRadius.md,
  },
});

export default AppearanceRow;
