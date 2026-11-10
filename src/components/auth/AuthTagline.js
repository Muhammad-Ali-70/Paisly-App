import React from 'react';
import { View, StyleSheet } from 'react-native';
import { hp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';

const AuthTagline = ({ title, subtitle, style }) => (
  <View style={[styles.container, style]}>
    <Label type="h3" weight="extraBold" color="textMain" style={styles.title}>
      {title}
    </Label>
    {subtitle ? (
      <Label type="body" color="textMuted" style={styles.subtitle}>
        {subtitle}
      </Label>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(3),
  },
  title: {
    marginBottom: hp(1),
  },
  subtitle: {
    lineHeight: hp(2.8),
  },
});

export default AuthTagline;
