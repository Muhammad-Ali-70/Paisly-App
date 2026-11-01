import React from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  Label,
  borderRadius,
  shadowPrimary,
} from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';

const SIZES = {
  sm: {
    height: hp(4),
    px: wp(4),
    labelType: 'bodySmall',
    labelWeight: 'semiBold',
  },
  md: {
    height: hp(5),
    px: wp(5),
    labelType: 'bodySmall',
    labelWeight: 'semiBold',
  },
  lg: {
    height: hp(6),
    px: wp(6),
    labelType: 'body',
    labelWeight: 'semiBold',
  },
};

const PrimaryButton = ({
  variant = 'primary',
  size = 'lg',
  label,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = true,
  bg,
  borderColor,
  labelColor,
  radius = borderRadius.lg,
  onPress,
  style,
  labelStyle,
}) => {
  const theme = useThemeColors();

  const VARIANTS = {
    primary: {
      bg: theme.primary,
      borderColor: undefined,
      labelColor: 'onPrimary',
      shadow: true,
    },
    outline: {
      bg: 'transparent',
      borderColor: theme.primary,
      labelColor: 'primary',
      shadow: false,
    },
    ghost: {
      bg: 'transparent',
      borderColor: undefined,
      labelColor: 'primary',
      shadow: false,
    },
    danger: {
      bg: theme.error,
      borderColor: undefined,
      labelColor: 'onPrimary',
      shadow: false,
    },
    dangerOutline: {
      bg: 'transparent',
      borderColor: theme.error,
      labelColor: 'error',
      shadow: false,
    },
    secondary: {
      bg: theme.secondary,
      borderColor: undefined,
      labelColor: 'onPrimary',
      shadow: false,
    },
    surface: {
      bg: theme.surfaceContainer,
      borderColor: undefined,
      labelColor: 'primary',
      shadow: false,
    },
  };

  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.lg;

  const resolvedBg = bg ?? v.bg;
  const resolvedBorder =
    borderColor === 'none' ? undefined : borderColor ?? v.borderColor;
  const resolvedLabelColor = labelColor ?? v.labelColor;

  const isInteractive = !disabled && !loading;

  return (
    <TouchableOpacity
      onPress={isInteractive ? onPress : undefined}
      activeOpacity={isInteractive ? 0.82 : 1}
      style={[
        styles.base,
        v.shadow && !disabled && shadowPrimary,
        {
          height: s.height,
          paddingHorizontal: s.px,
          backgroundColor: resolvedBg,
          borderRadius: radius,
          borderWidth: resolvedBorder ? 1.5 : 0,
          borderColor: resolvedBorder,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={theme.onPrimary}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          {label ? (
            <Label
              type={s.labelType}
              weight={s.labelWeight}
              color={resolvedLabelColor}
              style={[styles.label, labelStyle]}
            >
              {label}
            </Label>
          ) : null}

          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: wp(2),
  },
  iconRight: {
    marginLeft: wp(2),
  },
});

export default PrimaryButton;
