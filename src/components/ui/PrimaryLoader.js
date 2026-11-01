import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { hp } from '../../constants/responsive';

const PrimaryLoader = ({
  marginTop = 0,
  marginBottom = 0,
  width = 120,
  height = 120,
}) => {
  return (
    <View
      style={[
        styles.container,
        { marginTop: hp(marginTop), marginBottom: hp(marginBottom) },
      ]}
    >
      <LottieView
        source={require('../../assets/animations/moneyLoader.json')}
        autoPlay
        loop
        style={{ width, height }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrimaryLoader;
