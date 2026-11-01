import React, { useMemo } from 'react';
import { Modal, View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label, borderRadius } from '../../constants/globalstyle';

// The Modal draws under both system bars (like the main window) so the sheet's
// keyboard offset is measured against the full screen on every Android version;
// the bottom inset is padded manually instead.
const BottomSheet = ({ visible, onClose, title, children }) => {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + hp(2.5) }]}
        >
          <View style={styles.handle} />

          {title && (
            <Label
              type="bodyMedium"
              weight="bold"
              color="textMain"
              style={styles.title}
            >
              {title}
            </Label>
          )}

          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = t =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(11,28,48,0.4)',
    },
    sheet: {
      backgroundColor: t.surfacePrimary,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      paddingTop: hp(1.5),
      maxHeight: '90%',
    },
    handle: {
      width: wp(10),
      height: 4,
      borderRadius: 2,
      backgroundColor: t.outlineVariant,
      alignSelf: 'center',
      marginBottom: hp(2),
    },
    title: {
      paddingHorizontal: wp(5),
      marginBottom: hp(2),
    },
  });

export default BottomSheet;
