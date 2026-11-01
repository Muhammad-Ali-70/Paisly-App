import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  // Image, // TODO(post-MVP): Google Sign-In button
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import AppTextInput from '../../components/ui/AppTextInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AuthTagline from '../../components/auth/AuthTagline';
import AuthFooter from '../../components/auth/AuthFooter';
import LoginOptionsRow from '../../components/auth/LoginOptionsRow';
// TODO(post-MVP): Google Sign-In button
// import SectionDivider from '../../components/onboarding/Sectiondivider';
// import GoogleImage from '../../assets/images/static/logos/google.png';
import { useToastService } from '../../utils/ToastService';
import useAuthStore from '../../store/useAuthStore';

const LoginScreen = ({ navigation }) => {
  const toast = useToastService();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const login = useAuthStore(s => s.login);
  const isLoading = useAuthStore(s => s.isLoading);
  const theme = useThemeColors();
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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        <View style={styles.ctaWrapper}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={isLoading ? 'Signing in…' : 'Log In'}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>

        {/* TODO(post-MVP): re-enable once Google Sign-In is wired up
        <SectionDivider label="OR CONTINUE WITH" style={styles.divider} />

        <PrimaryButton
          variant="outline"
          size="lg"
          label="Google"
          leftIcon={
            <Image
              source={GoogleImage}
              style={styles.googleLogo}
              resizeMode="contain"
            />
          }
          onPress={() => {}}
        />
        */}

        <AuthFooter
          prompt="Don't have an account?"
          actionLabel="Sign Up"
          onActionPress={() => navigation.navigate('SignUpScreen')}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    flex: { flex: 1 },
    safe: { flex: 1, backgroundColor: t.background },
    scroll: {
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      paddingBottom: hp(4),
    },
    ctaWrapper: { marginTop: hp(1.5) },
    divider: { paddingHorizontal: 0 },
    googleLogo: {
      width: 25,
      height: 25,
    },
  });

export default LoginScreen;
