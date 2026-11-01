import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { X, ListPlus } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';

const TYPES = ['expense', 'income'];

const TransactionTypeHeader = ({
  type,
  onTypeChange,
  onClose,
  onBulkPress,
}) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeBtn}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <X size={wp(5.5)} color={theme.textMain} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.toggleWrap}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.toggleBtn,
              type === t && {
                backgroundColor:
                  t === 'expense' ? theme.error : theme.primary,
              },
            ]}
            onPress={() => onTypeChange(t)}
            activeOpacity={0.8}
          >
            <Label
              type="bodySmall"
              weight="semiBold"
              color={type === t ? 'white' : 'textMuted'}
            >
              {t === 'expense' ? 'Expense' : 'Income'}
            </Label>
          </TouchableOpacity>
        ))}
      </View>

      {onBulkPress && (
        <TouchableOpacity
          style={styles.bulkBtn}
          onPress={onBulkPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add many transactions at once"
        >
          <ListPlus size={wp(5.5)} color={theme.primary} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      paddingTop: Platform.OS === 'ios' ? hp(6) : hp(2),
      paddingBottom: hp(1.5),
    },
    closeBtn: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      backgroundColor: t.surfacePrimary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    bulkBtn: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      marginLeft: wp(3),
      backgroundColor: t.surfacePrimary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    toggleWrap: {
      flex: 1,
      flexDirection: 'row',
      marginLeft: wp(3),
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      padding: 4,
      gap: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: hp(1.2),
      borderRadius: 10,
      alignItems: 'center',
    },
  });

export default TransactionTypeHeader;
