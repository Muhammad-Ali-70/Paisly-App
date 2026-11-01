import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ListPlus } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';

// Discoverable twin of the header's bulk button: sits with the other "more
// ways to add" links at the bottom of the form.
const BulkAddLink = ({ onPress }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(), []);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ListPlus size={wp(4.5)} color={theme.primary} strokeWidth={1.8} />
      <Label type="bodySmall" weight="regular" color="primary" underline>
        Adding a whole day? Bulk add
      </Label>
    </TouchableOpacity>
  );
};

const createStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
      paddingVertical: hp(1),
      marginHorizontal: wp(5),
    },
  });

export default BulkAddLink;
