import React, { useRef, useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';

const OtpInput = ({ length = 6, value = '', onChange, error }) => {
  const inputs = useRef([]);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const digits = value.split('');

  const handleChange = (text, index) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = sanitized;

    // Fill gaps with empty string
    const newValue = Array.from({ length }, (_, i) => newDigits[i] || '').join(
      '',
    );
    onChange(newValue);

    // Move focus forward
    if (sanitized && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        const newValue = Array.from(
          { length },
          (_, i) => newDigits[i] || '',
        ).join('');
        onChange(newValue);
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = text => {
    // Handle paste — extract digits only
    const pasted = text.replace(/[^0-9]/g, '').slice(0, length);
    const newValue = pasted.padEnd(length, '').slice(0, length);
    onChange(newValue);
    // Focus last filled or last box
    const focusIndex = Math.min(pasted.length, length - 1);
    inputs.current[focusIndex]?.focus();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {Array.from({ length }).map((_, index) => {
          const isFilled = !!digits[index];
          const borderColor = error
            ? theme.error
            : isFilled
            ? theme.primary
            : theme.outlineVariant;

          return (
            <TextInput
              key={index}
              ref={ref => (inputs.current[index] = ref)}
              style={[styles.box, { borderColor }]}
              value={digits[index] || ''}
              onChangeText={text => {
                // Handle paste scenario — text length > 1
                if (text.length > 1) {
                  handlePaste(text);
                } else {
                  handleChange(text, index);
                }
              }}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={6} // allow paste
              selectTextOnFocus
              caretHidden
              placeholderTextColor={theme.textMuted}
              placeholder="·"
              cursorColor={theme.primary}
            />
          );
        })}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(2.5),
  },
  box: {
    flex: 1,
    height: hp(7),
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    backgroundColor: t.surfacePrimary,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: t.textMain,
  },
  error: {
    marginTop: hp(0.8),
    marginLeft: wp(1),
  },
});

export default OtpInput;
