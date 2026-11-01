import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';

const formatDate = date => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const DebtDatePicker = ({
  label,
  date,
  onChange,
  minimumDate,
  maximumDate,
  error,
  containerStyle,
}) => {
  const [show, setShow] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const borderColor = error
    ? theme.error
    : theme.outlineVariant;

  const handlePress = () => {
    setShow(true);
  };

  const handleChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selected) {
      onChange(selected);
      if (Platform.OS === 'ios') {
        setShow(false);
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
  };

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

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.inputRow, { borderColor }]}
      >
        <View style={styles.leftIcon}>
          <Calendar size={wp(4.5)} color={theme.textMuted} />
        </View>
        
        <Label type="bodySmall" weight="regular" color="textMain" style={styles.dateText}>
          {formatDate(date)}
        </Label>
      </TouchableOpacity>

      {error ? (
        <Label type="bodyXs" color="error" style={styles.error}>
          {error}
        </Label>
      ) : null}

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={handleChange}
          onDismiss={handleDismiss}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
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
    height: hp(6),
    paddingHorizontal: wp(4),
  },
  leftIcon: { marginRight: wp(2.5) },
  dateText: {
    flex: 1,
  },
  error: { marginTop: hp(0.5), marginLeft: wp(1) },
});

export default DebtDatePicker;
