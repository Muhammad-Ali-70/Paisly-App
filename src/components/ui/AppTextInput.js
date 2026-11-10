import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Search,
  Phone,
  Calendar,
  CreditCard,
} from 'lucide-react-native';

const ICON_MAP = {
  user: User,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  'eye-off': EyeOff,
  search: Search,
  phone: Phone,
  calendar: Calendar,
  card: CreditCard,
};

const AppIcon = ({ name, size = wp(4.5), color }) => {
  const Icon = ICON_MAP[name];
  return Icon ? <Icon size={size} color={color} /> : null;
};

const AppTextInput = ({
  label,
  leftIconName,
  rightIconName,
  onRightIconPress,
  secureTextEntry = false,
  error,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const borderColor = error
    ? theme.error
    : focused
    ? theme.primary
    : theme.outlineVariant;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Label
          type="bodySmall"
          weight="semiBold"
          color="textMain"
          style={styles.label}
        >
          {label}
        </Label>
      ) : null}

      <View style={[styles.inputRow, { borderColor }]}>
        {leftIconName ? (
          <View style={styles.leftIcon}>
            <AppIcon name={leftIconName} color={theme.textMuted} />
          </View>
        ) : null}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />

        {rightIconName ? (
          <Pressable
            style={({ pressed }) => [styles.rightIcon, pressed && styles.pressed]}
            onPress={onRightIconPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              rightIconName === 'eye'
                ? 'Hide password'
                : rightIconName === 'eye-off'
                ? 'Show password'
                : undefined
            }
          >
            <AppIcon name={rightIconName} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Label type="bodyXs" color="error" style={styles.error}>
          {error}
        </Label>
      ) : null}
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  wrapper: { marginBottom: hp(1) },
  label: { marginBottom: hp(0.7) },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.surfacePrimary,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    // Clamp so the field is never cramped on small phones or huge on tablets
    height: Math.min(Math.max(hp(6), 48), 56),
    paddingHorizontal: wp(4),
  },
  leftIcon: { marginRight: wp(2.5) },
  // Full-height, 48dp-wide tap target that reaches the field's right edge
  rightIcon: {
    alignSelf: 'stretch',
    width: 48,
    marginRight: -wp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.5 },
  input: {
    flex: 1,
    color: t.textMain,
    fontSize: 14,
    paddingVertical: 0,
  },
  error: { marginTop: hp(0.5), marginLeft: wp(1) },
});

export default AppTextInput;
