import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';
import GoogleImage from '../../assets/images/static/logos/google.png';

const SettingsProfileCard = ({ name, email, isPremium, isGoogleLinked, avatarSource, avatarUrl, onEditPress }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const uri = avatarSource?.uri || avatarUrl || null;
  const initials = name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onEditPress} activeOpacity={0.8}>
        <View style={styles.avatarWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Label type="h4" weight="bold" color="onPrimary">
                {initials}
              </Label>
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
            <Pencil size={wp(3.5)} color={theme.onPrimary} strokeWidth={2} />
          </View>
        </View>
      </TouchableOpacity>

      <Label type="h3" weight="bold" color="textMain" style={styles.name}>
        {name}
      </Label>
      <Label type="bodySmall" weight="regular" color="textMuted" style={styles.email}>
        {email}
      </Label>

      {isGoogleLinked && (
        <View style={styles.googleTag}>
          <Image source={GoogleImage} style={styles.googleLogo} resizeMode="contain" />
          <Label type="bodyXs" weight="semiBold" color="textMuted">
            Signed in with Google
          </Label>
        </View>
      )}

      {isPremium && (
        <View style={styles.badge}>
          <Label type="bodyXs" weight="semiBold" color="primary" style={styles.badgeText}>
            PREMIUM MEMBER
          </Label>
        </View>
      )}
    </View>
  );
};

const createStyles = (t) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: hp(1),
      paddingBottom: hp(3),
    },
    avatarWrap: {
      position: 'relative',
      marginBottom: hp(1.5),
    },
    avatarImage: {
      width: wp(22),
      height: wp(22),
      borderRadius: wp(11),
    },
    avatarFallback: {
      width: wp(22),
      height: wp(22),
      borderRadius: wp(11),
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: wp(7),
      height: wp(7),
      borderRadius: wp(3.5),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
      borderColor: t.background,
    },
    name: {
      marginBottom: hp(0.4),
    },
    email: {
      marginBottom: hp(1.2),
    },
    badge: {
      borderWidth: 1,
      borderColor: t.primary,
      borderRadius: borderRadius.full,
      paddingHorizontal: wp(4),
      paddingVertical: hp(0.6),
      backgroundColor: t.surfaceContainerLow,
    },
    badgeText: {
      letterSpacing: 0.6,
    },
    googleTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
      borderWidth: 1,
      borderColor: t.outlineVariant,
      borderRadius: borderRadius.full,
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.5),
      backgroundColor: t.surfaceContainerLow,
      marginBottom: hp(1),
    },
    googleLogo: {
      width: wp(3.5),
      height: wp(3.5),
    },
  });

export default SettingsProfileCard;
