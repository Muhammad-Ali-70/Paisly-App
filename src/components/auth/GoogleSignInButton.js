import React, { useRef, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import PrimaryButton from '../ui/PrimaryButton';
import GoogleImage from '../../assets/images/static/logos/google.png';
import { useToastService } from '../../utils/ToastService';
import useAuthStore from '../../store/useAuthStore';
import { useThemeColors } from '@hooks/useThemeColors';

/**
 * "Continue with Google" button. Handles the whole flow: account picker, backend
 * sign-in, toasts. Cancelling the picker is silent. On success the navigator
 * switches stacks on its own because the store now holds a token.
 *
 * `beforeSignIn` can return false to block the flow (e.g. terms not accepted).
 */
const GoogleSignInButton = ({ beforeSignIn, disabled, style }) => {
  const toast = useToastService();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const theme = useThemeColors();
  const googleLogin = useAuthStore(s => s.googleLogin);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    if (beforeSignIn && beforeSignIn() === false) return;

    setLoading(true);
    const result = await googleLogin();
    setLoading(false);

    if (result.cancelled) return;
    if (result.success) {
      toastRef.current.success(result.isNewUser ? 'Welcome to Paisly!' : 'Welcome back!');
    } else {
      toastRef.current.error(result.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <PrimaryButton
      variant="outline"
      size="lg"
      bg={theme.surfacePrimary}
      borderColor={theme.outlineVariant}
      labelColor="primary"
      label="Continue with Google"
      leftIcon={
        <Image source={GoogleImage} style={styles.logo} resizeMode="contain" />
      }
      onPress={handlePress}
      loading={loading}
      disabled={disabled || loading}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  logo: { width: 22, height: 22 },
});

export default GoogleSignInButton;
