import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import AppTextInput from '../../components/ui/AppTextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AuthTagline from '../../components/auth/AuthTagline';
import AuthFooter from '../../components/auth/AuthFooter';
import AuthLegalNote from '../../components/auth/AuthLegalNote';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import SectionDivider from '../../components/onboarding/Sectiondivider';
import { validateSignUp } from '../../utils/validation';
import { useToastService } from '../../utils/ToastService';
import useAuthStore from '../../store/useAuthStore';

const SignUpScreen = ({ navigation }) => {
  const toast = useToastService();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const signup = useAuthStore(s => s.signup);
  const isLoading = useAuthStore(s => s.isLoading);
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = key => setErrors(prev => ({ ...prev, [key]: undefined }));

  const handleSignUp = async () => {
    const validationErrors = validateSignUp({
      fullName,
      email,
      password,
      confirmPassword,
      // Consent is given by tapping Sign Up next to the legal note below
      agreedToTerms: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const result = await signup({
      name: fullName.trim(),
      email: email.trim(),
      password,
    });

    if (result.success) {
      navigation.navigate('VerifyOTPScreen', {
        email: result.email,
        source: 'signup',
      });
    } else {
      toastRef.current.error(
        result.message || 'Sign up failed. Please try again.',
      );
    }
  };

  return (
    <View style={styles.safe}>
      <KeyboardAwareScrollView
        bottomOffset={hp(3)}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, hp(2)) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <AuthTagline
            title="Create Account"
            subtitle="Start tracking your finances with Paisly."
          />

          <AppTextInput
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChangeText={text => {
              setFullName(text);
              clearError('fullName');
            }}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={errors.fullName}
            leftIconName="user"
          />

          <AppTextInput
            label="Email Address"
            placeholder="john@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              clearError('email');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
            leftIconName="mail"
          />

          <AppTextInput
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={text => {
              setPassword(text);
              clearError('password');
            }}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
            leftIconName="lock"
            rightIconName={showPassword ? 'eye' : 'eye-off'}
            onRightIconPress={() => setShowPassword(v => !v)}
          />

          <AppTextInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              clearError('confirmPassword');
            }}
            secureTextEntry={!showConfirm}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.confirmPassword}
            leftIconName="lock"
            rightIconName={showConfirm ? 'eye' : 'eye-off'}
            onRightIconPress={() => setShowConfirm(v => !v)}
          />

          <PrimaryButton
            variant="primary"
            size="lg"
            label={isLoading ? 'Creating account…' : 'Sign Up'}
            onPress={handleSignUp}
            loading={isLoading}
            disabled={isLoading}
            style={styles.cta}
          />
        </View>

        {/* Pinned to the bottom on tall screens; flows naturally on short ones */}
        <View style={styles.bottom}>
          <SectionDivider label="OR" style={styles.divider} />
          <GoogleSignInButton disabled={isLoading} />
          <AuthFooter
            prompt="Already have an account?"
            actionLabel="Log In"
            onActionPress={() => navigation.navigate('LoginScreen')}
            style={styles.footer}
          />
          <AuthLegalNote action="signing up" />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    scroll: {
      flexGrow: 1,
      justifyContent: 'space-between',
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
    },
    cta: { marginTop: hp(1.5) },
    bottom: { paddingTop: hp(2) },
    divider: { paddingHorizontal: 0, marginTop: 0 },
    footer: { marginTop: hp(2.5) },
  });

export default SignUpScreen;
