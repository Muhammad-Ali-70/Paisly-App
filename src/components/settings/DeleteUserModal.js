import React, { useMemo, useState } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { AlertTriangle } from 'lucide-react-native';
import { borderRadius, Label } from '../../constants/globalstyle';
import AppTextInput from '../ui/AppTextInput';
import PrimaryButton from '../ui/PrimaryButton';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';

// Deletes the user's Paisly account (not a money account — see accounts/DeleteAccountModal).
const DeleteUserModal = ({ visible, loading, error, onConfirm, onCancel }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const close = () => {
    if (loading) return;
    setPassword('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <TouchableWithoutFeedback onPress={close}>
        <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <AlertTriangle size={wp(12)} color={theme.error} strokeWidth={1.5} />
              </View>

              <Label type="h3" weight="bold" color="textMain" style={styles.title}>
                Delete Account?
              </Label>

              <Label type="bodySmall" weight="regular" color="textMuted" style={styles.message}>
                This permanently deletes your profile, accounts, transactions, budgets, debts and
                categories. This cannot be undone.
              </Label>

              <AppTextInput
                label="Enter your password to confirm"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                error={error}
                leftIconName="lock"
                rightIconName={showPassword ? 'eye' : 'eye-off'}
                onRightIconPress={() => setShowPassword(v => !v)}
                containerStyle={styles.input}
              />

              <View style={styles.actions}>
                <PrimaryButton
                  variant="outline"
                  size="md"
                  label="Cancel"
                  onPress={close}
                  disabled={loading}
                  style={styles.button}
                />
                <PrimaryButton
                  variant="error"
                  size="md"
                  label="Delete"
                  onPress={() => onConfirm(password)}
                  loading={loading}
                  disabled={!password}
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = t => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  card: {
    width: '100%',
    backgroundColor: t.surfacePrimary,
    borderRadius: borderRadius.xl,
    padding: wp(5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  iconContainer: {
    marginBottom: hp(2),
  },
  title: {
    textAlign: 'center',
    marginBottom: hp(1),
  },
  message: {
    textAlign: 'center',
    marginBottom: hp(2),
  },
  input: {
    width: '100%',
    marginBottom: hp(2),
  },
  actions: {
    flexDirection: 'row',
    gap: wp(3),
    width: '100%',
  },
  button: {
    flex: 1,
  },
});

export default DeleteUserModal;
