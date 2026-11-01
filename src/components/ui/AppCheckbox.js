import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

import { useThemeColors } from '@hooks/useThemeColors';
import { wp } from '../../constants/responsive';
import { borderRadius } from '../../constants/globalstyle';

const AppCheckbox = ({ checked = false, onToggle, style }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.box, checked && styles.checked, style]}
    >
      {checked ? (
        <Check size={wp(3.2)} color={theme.onPrimary} strokeWidth={3} />
      ) : null}
    </TouchableOpacity>
  );
};

const createStyles = t => StyleSheet.create({
  box: {
    width: wp(5),
    height: wp(5),
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: t.outlineVariant,
    backgroundColor: t.surfacePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
});

export default AppCheckbox;
