import React, { useState, useCallback, useRef, useMemo } from 'react';
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
import LoginOptionsRow from '../../components/auth/LoginOptionsRow';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import SectionDivider from '../../components/onboarding/Sectiondivider';
import { useToastService } from '../../utils/ToastService';
import useAuthStore from '../../store/useAuthStore';

const LoginScreen = ({ navigation }) => {
  const toast = useToastService();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const login = useAuthStore(s => s.login);
  const isLoading = useAuthStore(s => s.isLoading);
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});

  const clearError = key => setErrors(prev => ({ ...prev, [key]: undefined }));

  const handleLogin = useCallback(async () => {
    const newErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const result = await login({ email: trimmedEmail, password, rememberMe });

    if (result.success) {
      toastRef.current.success('Welcome back!');
    } else {
      toastRef.current.error(
        result.message || 'Login failed. Please check your credentials.',
      );
    }
  }, [email, password, rememberMe, login]);

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
            title="Welcome Back"
            subtitle="Sign in to continue tracking your finances."
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
            placeholder="••••••••"
            value={password}
            onChangeText={text => {
              setPassword(text);
              clearError('password');
            }}
            secureTextEntry={!showPassword}
            autoComplete="password"
            textContentType="password"
            error={errors.password}
            leftIconName="lock"
            rightIconName={showPassword ? 'eye' : 'eye-off'}
            onRightIconPress={() => setShowPassword(v => !v)}
          />

          <LoginOptionsRow
            rememberMe={rememberMe}
            onRememberMeToggle={() => setRememberMe(v => !v)}
            onForgotPassword={() => navigation.navigate('ForgotPasswordScreen')}
          />

          <PrimaryButton
            variant="primary"
            size="lg"
            label={isLoading ? 'Signing in…' : 'Log In'}
            onPress={handleLogin}
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
            prompt="Don't have an account?"
            actionLabel="Sign Up"
            onActionPress={() => navigation.navigate('SignUpScreen')}
            style={styles.footer}
          />
          <AuthLegalNote />
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
    cta: { marginTop: hp(1) },
    bottom: { paddingTop: hp(2) },
    divider: { paddingHorizontal: 0, marginTop: 0 },
    footer: { marginTop: hp(2.5) },
  });

export default LoginScreen;
