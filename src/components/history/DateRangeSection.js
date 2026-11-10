import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { borderRadius, Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { toDayString } from '../../utils/recurring';
import { calendarDay } from '../../utils/safeToSpend';

const DateRangeSection = ({ dateFrom, dateTo, onDateFromChange, onDateToChange }) => {
  const theme = useThemeColors();
  const [showPicker, setShowPicker] = useState(null);

  const formatDate = date => {
    if (!date) return 'Select Date';
    const d = calendarDay(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    
    if (event.type === 'set' && selectedDate) {
      // Local calendar day: toISOString() would give yesterday before 05:00 in PKT
      const isoDate = toDayString(selectedDate);
      if (showPicker === 'from') {
        onDateFromChange(isoDate);
      } else if (showPicker === 'to') {
        onDateToChange(isoDate);
      }
    }
    
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowPicker(null);
    }
  };

  const handleIOSDone = () => {
    setShowPicker(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceSecondary }]}>
      <View style={styles.row}>
        <View style={styles.inputWrapper}>
          <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.label}>
            From
          </Label>
          <TouchableOpacity
            style={[styles.dateInput, { 
              backgroundColor: theme.surfacePrimary,
              borderColor: theme.outlineVariant 
            }]}
            onPress={() => setShowPicker('from')}
            activeOpacity={0.7}
          >
            <Calendar size={wp(4)} color={theme.textMuted} strokeWidth={1.8} />
            <Label 
              type="bodySmall" 
              weight="regular" 
              color={dateFrom ? 'textMain' : 'textMuted'}
            >
              {formatDate(dateFrom)}
            </Label>
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.label}>
            To
          </Label>
          <TouchableOpacity
            style={[styles.dateInput, { 
              backgroundColor: theme.surfacePrimary,
              borderColor: theme.outlineVariant 
            }]}
            onPress={() => setShowPicker('to')}
            activeOpacity={0.7}
          >
            <Calendar size={wp(4)} color={theme.textMuted} strokeWidth={1.8} />
            <Label 
              type="bodySmall" 
              weight="regular" 
              color={dateTo ? 'textMain' : 'textMuted'}
            >
              {formatDate(dateTo)}
            </Label>
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPickerHeader}>
            <TouchableOpacity onPress={() => setShowPicker(null)}>
              <Label type="bodySmall" weight="semiBold" color="textMuted">
                Cancel
              </Label>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleIOSDone}>
              <Label type="bodySmall" weight="semiBold" color="primary">
                Done
              </Label>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={
              showPicker === 'from' && dateFrom
                ? calendarDay(dateFrom)
                : showPicker === 'to' && dateTo
                ? calendarDay(dateTo)
                : new Date()
            }
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            maximumDate={new Date()}
            textColor={theme.textMain}
          />
        </View>
      )}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={
            showPicker === 'from' && dateFrom
              ? calendarDay(dateFrom)
              : showPicker === 'to' && dateTo
              ? calendarDay(dateTo)
              : new Date()
          }
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    marginTop: hp(1),
  },
  row: {
    flexDirection: 'row',
    gap: wp(3),
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    marginBottom: hp(0.8),
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  iosPickerContainer: {
    marginTop: hp(2),
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
});

export default DateRangeSection;
