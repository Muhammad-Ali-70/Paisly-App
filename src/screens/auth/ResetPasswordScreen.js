import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import AppTextInput from '../../components/ui/AppTextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AuthTagline from '../../components/auth/AuthTagline';
import { useToastService } from '../../utils/ToastService';
import { resetPasswordApi } from '../../services/authService';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { resetToken } = route.params;

  const toast = useToastService();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const clearError = key => setErrors(prev => ({ ...prev, [key]: undefined }));

  const handleReset = useCallback(async () => {
    const newErrors = {};

    if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters.';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await resetPasswordApi({ resetToken, newPassword });
      toastRef.current.success('Password reset successfully!');
      // Go back to login — replace so user can't go back to reset screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (e) {
      toastRef.current.error(
        e?.response?.data?.message || 'Reset failed. Please start over.',
      );
    } finally {
      setLoading(false);
    }
  }, [newPassword, confirmPassword, resetToken, navigation]);

  return (
    <View style={styles.safe}>
      <KeyboardAwareScrollView
        bottomOffset={hp(3)}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthTagline
          title="Reset Password"
          subtitle="Enter your new password below. Make it strong."
        />

        <AppTextInput
          label="New Password"
          placeholder="••••••••"
          value={newPassword}
          onChangeText={text => {
            setNewPassword(text);
            clearError('newPassword');
          }}
          secureTextEntry={!showPassword}
          error={errors.newPassword}
          leftIconName="lock"
          rightIconName={showPassword ? 'eye' : 'eye-off'}
          onRightIconPress={() => setShowPassword(v => !v)}
        />

        <AppTextInput
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            clearError('confirmPassword');
          }}
          secureTextEntry={!showConfirm}
          error={errors.confirmPassword}
          leftIconName="lock"
          rightIconName={showConfirm ? 'eye' : 'eye-off'}
          onRightIconPress={() => setShowConfirm(v => !v)}
        />

        <View style={styles.ctaWrapper}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={loading ? 'Resetting…' : 'Reset Password'}
            onPress={handleReset}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: t.background },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  ctaWrapper: { marginTop: hp(2.5) },
});

export default ResetPasswordScreen;
