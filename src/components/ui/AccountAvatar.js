import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Label } from '../../constants/globalstyle';
import { wp } from '../../constants/responsive';

const AccountAvatar = ({
  imageUri,
  initials,
  color,
  size = wp(12),
  fontSize,
}) => {
  if (imageUri) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 4,
            // backgroundColor: '#F1F5F9',
          },
        ]}
      >
        <Image
          source={imageUri}
          resizeMode="cover"
          style={{
            width: size * 0.9,
            height: size * 0.9,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: (color ?? '#94A3B8') + '22',
        },
      ]}
    >
      <Label
        type="bodyXs"
        weight="bold"
        style={{ color: color ?? '#94A3B8', fontSize: fontSize ?? size * 0.35 }}
      >
        {initials ?? '?'}
      </Label>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default AccountAvatar;
