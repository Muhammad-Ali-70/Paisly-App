import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Label } from '../../constants/globalstyle';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';

const SectionDivider = ({ label, style }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.label}>
        {label}
      </Label>
      <View style={styles.line} />
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginVertical: hp(2),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: t.outlineVariant,
  },
  label: {
    marginHorizontal: wp(3),
    letterSpacing: 1.2,
  },
});

export default SectionDivider;
