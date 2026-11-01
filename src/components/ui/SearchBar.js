import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { borderRadius } from '../../constants/globalstyle';
import { RFValue } from 'react-native-responsive-fontsize';
import fonts from '../../constants/fonts';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  containerStyle,
}) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.container, containerStyle]}>
      <Search size={wp(4.5)} color={theme.textMuted} strokeWidth={1.8} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.surfacePrimary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.4),
    gap: wp(2.5),
  },
  input: {
    flex: 1,
    fontSize: RFValue(13),
    fontFamily: fonts.regular,
    color: t.textMain,
    padding: 0,
    includeFontPadding: false,
  },
});

export default SearchBar;
