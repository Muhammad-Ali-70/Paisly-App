import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { wp, hp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label, borderRadius } from '../../constants/globalstyle';
import PaymentIcon from '../common/Paymenticon';
import AccountAvatar from './AccountAvatar';

const SelectableIcon = ({
  iconName,
  iconColor,
  iconBg,
  label,
  active = false,
  onPress,
  onLongPress,
  size = 'md',
  imageUri,
  initials,
  color,
}) => {
  const isLg = size === 'lg';
  const isGrid = size === 'grid';

  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const avatarSize = isLg ? wp(12) : isGrid ? wp(13) : wp(11);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={1}
      style={[
        styles.base,
        isLg && styles.lg,
        isGrid && styles.grid,
        active && styles.active,
      ]}
    >
      {imageUri ? (
        <AccountAvatar
          imageUri={imageUri}
          initials={initials}
          color={color}
          size={avatarSize}
        />
      ) : (
        <PaymentIcon
          name={iconName}
          backgroundColor={active ? theme.primary : iconBg}
          color={active ? theme.onPrimary : iconColor}
          containerSize={avatarSize}
          size={isLg ? wp(6) : isGrid ? wp(6.5) : wp(5.2)}
        />
      )}
      <Label
        type="bodyXs"
        weight={active ? 'semiBold' : 'regular'}
        color={active ? 'primary' : 'textMuted'}
      >
        {label}
      </Label>
    </TouchableOpacity>
  );
};

const createStyles = t => StyleSheet.create({
  base: {
    alignItems: 'center',
    gap: hp(0.8),
    paddingVertical: hp(1),
    width: wp(20),
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lg: {
    flex: 1,
    paddingVertical: hp(2),
    backgroundColor: t.surfacePrimary,
  },
  grid: {
    width: (wp(100) - wp(6) - wp(9)) / 4,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(1),
  },
  active: {
    borderColor: t.primary,
  },
});

export default SelectableIcon;
