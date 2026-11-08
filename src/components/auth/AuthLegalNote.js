import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { hp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import { LINKS } from '../../constants/links';

/** Small "By continuing you agree to…" line shown at the bottom of auth screens. */
const AuthLegalNote = ({ action = 'continuing', style }) => (
  <Label type="bodyXs" color="textMuted" style={[styles.text, style]}>
    By {action} you agree to our{' '}
    <Label
      type="bodyXs"
      weight="semiBold"
      color="primary"
      onPress={() => Linking.openURL(LINKS.terms)}
    >
      Terms
    </Label>{' '}
    and{' '}
    <Label
      type="bodyXs"
      weight="semiBold"
      color="primary"
      onPress={() => Linking.openURL(LINKS.privacy)}
    >
      Privacy Policy
    </Label>
  </Label>
);

const styles = StyleSheet.create({
  text: { textAlign: 'center', marginTop: hp(1.5) },
});

export default AuthLegalNote;
