import React, { useMemo } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { wp, hp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';

const Logo = ({ width = wp(75), height = hp(8), style }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.container, style]}>
      {/* <Image
        source={require('../../assets/images/static/logos/MainLogo.png')}
        style={{ width, height, resizeMode: 'cover' }}
      /> */}
      <Label type="displayMd" color={theme.primary}>
        Paisly
      </Label>
    </View>
  );
};

export default Logo;

const createStyles = t => StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
