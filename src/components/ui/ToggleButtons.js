import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';

const ToggleButtons = ({
  options = [],
  activeValue,
  onSelect,
  containerStyle,
  disabled = false,
}) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      {options.map(option => {
        const isActive = activeValue === option.value;
        const backgroundColor = isActive
          ? option.color || theme.primary
          : 'transparent';

        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.button, { backgroundColor }]}
            onPress={() => !disabled && onSelect(option.value)}
            activeOpacity={0.8}
            disabled={disabled}
          >
            <Label
              type="bodySmall"
              weight="semiBold"
              color={isActive ? 'white' : 'textMuted'}
            >
              {option.label}
            </Label>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    button: {
      flex: 1,
      paddingVertical: hp(1.2),
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default ToggleButtons;
