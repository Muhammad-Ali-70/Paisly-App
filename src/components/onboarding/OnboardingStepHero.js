import React from 'react';
import { View, StyleSheet } from 'react-native';
import { hp, wp } from '../../constants/responsive';
import { Label, borderRadius } from '../../constants/globalstyle';

// Icon tile + title + one-line explanation: the "what am I doing here" block
// at the top of each onboarding step.
const OnboardingStepHero = ({ icon: Icon, tint, title, subtitle }) => (
  <View style={styles.container}>
    <View style={[styles.tile, { backgroundColor: `${tint}26` }]}>
      <Icon size={wp(8)} color={tint} strokeWidth={1.8} />
    </View>
    <Label type="h2" weight="bold" color="textMain" style={styles.title}>
      {title}
    </Label>
    <Label
      type="bodySmall"
      weight="regular"
      color="textMuted"
      style={styles.subtitle}
    >
      {subtitle}
    </Label>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingTop: hp(3),
    paddingBottom: hp(3),
    gap: hp(1.2),
  },
  tile: {
    width: wp(18),
    height: wp(18),
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.8),
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
});

export default OnboardingStepHero;
