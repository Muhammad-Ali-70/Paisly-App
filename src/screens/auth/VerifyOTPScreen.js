import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label } from '../../constants/globalstyle';
import OtpInput from '../../components/ui/OtpInput';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AuthTagline from '../../components/auth/AuthTagline';
import { useToastService } from '../../utils/ToastService';
import { verifyOtpApi, forgotPasswordApi, resendSignupOtpApi } from '../../services/authService';
import useAuthStore from '../../store/useAuthStore';

const VerifyOTPScreen = ({ navigation, route }) => {
  const { email, source = 'forgot-password' } = route.params;

  const toast = useToastService();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const verifySignupOtp = useAuthStore(s => s.verifySignupOtp);
  const isSignupFlow = source === 'signup';

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleVerify = useCallback(async () => {
    if (otp.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }

    setOtpError('');
    setLoading(true);

    try {
      if (isSignupFlow) {
        const result = await verifySignupOtp({ email, otp });
        if (result.success) {
          toastRef.current.success('Email verified successfully!');
        } else {
          setOtpError(result.message || 'Verification failed');
        }
      } else {
        const { resetToken } = await verifyOtpApi({ email, otp });
        navigation.navigate('ResetPasswordScreen', { resetToken });
      }
    } catch (e) {
      // apiClient's interceptor flattens errors: the server message is e.message
      setOtpError(e?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, email, isSignupFlow, verifySignupOtp, navigation]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setOtp('');
    setOtpError('');
    try {
      if (isSignupFlow) {
        await resendSignupOtpApi({ email });
      } else {
        await forgotPasswordApi({ email });
      }
      toastRef.current.success('A new OTP has been sent to your email.');
    } catch (e) {
      toastRef.current.error('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  }, [email, isSignupFlow]);

  return (
    <View style={styles.safe}>
      <KeyboardAwareScrollView
        bottomOffset={hp(3)}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthTagline
          title={isSignupFlow ? 'Verify Email' : 'Enter OTP'}
          subtitle={
            isSignupFlow
              ? `We sent a 6-digit code to ${email}. Verify to activate your account.`
              : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`
          }
        />

        <Label
          type="bodySmall"
          weight="semiBold"
          color="textMain"
          style={styles.otpLabel}
        >
          Verification Code
        </Label>

        <OtpInput
          length={6}
          value={otp}
          onChange={val => {
            setOtp(val);
            if (otpError) setOtpError('');
          }}
          error={otpError}
        />

        <View style={styles.ctaWrapper}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={loading ? 'Verifying…' : 'Verify OTP'}
            onPress={handleVerify}
            loading={loading}
            disabled={loading || otp.length < 6}
          />
        </View>

        <View style={styles.resendRow}>
          <Label type="bodySmall" color="textMuted">
            Didn't receive it?{' '}
          </Label>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resending}
            activeOpacity={0.7}
          >
            <Label type="bodySmall" weight="semiBold" color="primary">
              {resending ? 'Sending…' : 'Resend OTP'}
            </Label>
          </TouchableOpacity>
        </View>

        <View style={styles.backRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Label type="bodySmall" weight="semiBold" color="textMuted">
              {isSignupFlow ? '← Back to Sign Up' : '← Change email'}
            </Label>
          </TouchableOpacity>
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
  otpLabel: { marginBottom: hp(1) },
  ctaWrapper: { marginTop: hp(3) },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2.5),
  },
  backRow: {
    alignItems: 'center',
    marginTop: hp(1.5),
  },
});

export default VerifyOTPScreen;
