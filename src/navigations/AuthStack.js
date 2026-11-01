import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import useAuthStore from '../store/useAuthStore';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  // Read once: new installs land on Sign Up, returning users on Log In. Must not
  // follow the store afterwards or the stack would jump while the user is mid-flow.
  const [initialRoute] = useState(() =>
    useAuthStore.getState().hasAccount ? 'LoginScreen' : 'SignUpScreen',
  );

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
      <Stack.Screen name="VerifyOTPScreen" component={VerifyOTPScreen} />
      <Stack.Screen
        name="ResetPasswordScreen"
        component={ResetPasswordScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
