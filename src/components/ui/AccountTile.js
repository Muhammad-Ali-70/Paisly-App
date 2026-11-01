import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { wp, hp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label, borderRadius } from '../../constants/globalstyle';
import AccountAvatar from './AccountAvatar';

const AccountTile = ({
  imageUri,
  initials,
  color,
  label,
  active = false,
  disabled = false,
  onPress,
  size = wp(13),
}) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.75}
      style={[
        styles.tile,
        active && styles.tileActive,
        disabled && styles.tileDisabled,
      ]}
    >
      <AccountAvatar
        imageUri={imageUri}
        initials={initials}
        color={color}
        size={size}
      />
      <Label
        type="bodyXs"
        weight={active ? 'semiBold' : 'regular'}
        color={active ? 'primary' : disabled ? 'textDisabled' : 'textMuted'}
        style={styles.label}
        numberOfLines={2}
      >
        {label}
      </Label>
    </TouchableOpacity>
  );
};

const createStyles = t =>
  StyleSheet.create({
    tile: {
      width: (wp(100) - wp(10) - wp(9)) / 4,
      alignItems: 'center',
      gap: hp(0.8),
      paddingVertical: hp(1.5),
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    tileActive: {
      borderColor: t.primary,
      backgroundColor: t.surfaceContainerLow,
    },
    tileDisabled: { opacity: 0.4 },
    label: { textAlign: 'center', lineHeight: 14 },
  });

export default AccountTile;
