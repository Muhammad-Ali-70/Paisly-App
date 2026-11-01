import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Camera } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import ScreenHeader from '../../../components/common/Screenheader';
import AppTextInput from '../../../components/ui/AppTextInput';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { useThemeColors } from '@hooks/useThemeColors';
import { borderRadius, Label } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import { useToastService } from '../../../utils/ToastService';
import useAuthStore from '../../../store/useAuthStore';

const EditProfileScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const toast = useToastService();

  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatarUri, setAvatarUri] = useState(null);

  const handlePickImage = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    });

    if (result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.warning('Name is required');
      return;
    }

    const profileResult = await updateProfile({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
    });

    if (!profileResult.success) {
      toast.error(profileResult.message || 'Failed to update profile');
      return;
    }

    if (avatarUri) {
      const avatarResult = await uploadAvatar(avatarUri);
      if (!avatarResult.success) {
        toast.error(avatarResult.message || 'Failed to upload photo');
        return;
      }
      await fetchMe();
    }

    toast.success('Profile updated');
    navigation.goBack();
  }, [name, phoneNumber, avatarUri, updateProfile, uploadAvatar, fetchMe, navigation, toast]);

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : user?.avatar
    ? { uri: user.avatar }
    : null;

  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Edit Profile"
        onBack={() => navigation.goBack()}
        backIcon="arrow"
      />

      <KeyboardAwareScrollView
        bottomOffset={hp(3)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Label type="h2" weight="bold" color="onPrimary">
                  {initials}
                </Label>
              </View>
            )}
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.8}
              style={[styles.editBadge, { backgroundColor: theme.primary }]}
            >
              <Camera size={wp(4)} color={theme.onPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <Label type="bodyXs" weight="regular" color="textMuted" style={{ marginTop: hp(1) }}>
            Tap to change photo
          </Label>
        </View>

        <AppTextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          leftIconName="user"
        />

        <AppTextInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+92 300 1234567"
          keyboardType="phone-pad"
          leftIconName="phone"
        />

        <Label type="bodyXs" weight="regular" color="textMuted" style={styles.emailRow}>
          {user?.email}
        </Label>

        <View style={styles.footer}>
          <PrimaryButton
            variant="primary"
            size="lg"
            label={isLoading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={isLoading}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const createStyles = (t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    scrollContent: { paddingBottom: hp(12), paddingHorizontal: wp(5) },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: hp(3),
    },
    avatarWrap: {
      position: 'relative',
    },
    avatarImage: {
      width: wp(28),
      height: wp(28),
      borderRadius: wp(14),
    },
    avatarFallback: {
      width: wp(28),
      height: wp(28),
      borderRadius: wp(14),
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: t.background,
    },
    emailRow: {
      textAlign: 'center',
      marginTop: hp(2),
    },
    footer: {
      marginTop: hp(3),
    },
  });

export default EditProfileScreen;
