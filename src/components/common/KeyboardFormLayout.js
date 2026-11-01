import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';

/**
 * Screen skeleton for forms with a primary action pinned to the bottom:
 * header, a scroll area that keeps the focused field (or multiline caret)
 * visible, and a footer that rides on top of the keyboard.
 *
 * The screen itself is never resized, so there is nothing to double-compensate
 * (the problem with KeyboardAvoidingView + adjustResize on Android).
 */
const KeyboardFormLayout = ({
  header,
  footer,
  children,
  contentContainerStyle,
  style,
}) => {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }, style]}>
      {header}

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={contentContainerStyle}
        // The sticky footer covers the bottom of the scroll area while typing
        bottomOffset={footerHeight + hp(2)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>

      {footer ? (
        // The keyboard height includes the bottom inset the screen already
        // leaves free; `opened` cancels it so the footer sits flush on the keys.
        <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
          <View
            style={{ backgroundColor: theme.background }}
            onLayout={e => setFooterHeight(e.nativeEvent.layout.height)}
          >
            {footer}
          </View>
        </KeyboardStickyView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default KeyboardFormLayout;
