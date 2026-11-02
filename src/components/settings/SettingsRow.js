import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ChevronRight,
  Moon,
  CircleDollarSign,
  Bell,
  Upload,
  CloudCog,
  User,
  Shield,
  HelpCircle,
  LogOut,
  TrendingUp,
  Calculator,
  ArrowLeftRight,
  Repeat,
} from 'lucide-react-native';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { useIsDarkMode } from '@hooks/useIsDarkMode';
import { hp, wp } from '../../constants/responsive';

const ICONS = {
  moon: Moon,
  currency: CircleDollarSign,
  bell: Bell,
  upload: Upload,
  cloud: CloudCog,
  user: User,
  shield: Shield,
  help: HelpCircle,
  logout: LogOut,
  trendingup: TrendingUp,
  calculator: Calculator,
  transfer: ArrowLeftRight,
  repeat: Repeat,
};

const LIGHT_ICON_THEMES = {
  moon: { bg: '#EFF6FF' },
  currency: { bg: '#E6FFF5' },
  bell: { bg: '#EFF6FF' },
  upload: { bg: '#FFF3E6' },
  cloud: { bg: '#F5F3FF' },
  user: { bg: '#E6FFF5' },
  shield: { bg: '#FFF3E6' },
  help: { bg: '#F5F3FF' },
  logout: { bg: '#FFF0F0' },
  trendingup: { bg: '#e2e8f8' },
  calculator: { bg: '#FFF3E6' },
  transfer: { bg: '#EFF6FF' },
  repeat: { bg: '#F5F3FF' },
};

const DARK_ICON_THEMES = {
  moon: { bg: '#1E3A5F' },
  currency: { bg: '#0B3D2E' },
  bell: { bg: '#1E3A5F' },
  upload: { bg: '#3D2E0B' },
  cloud: { bg: '#2E1E5E' },
  user: { bg: '#0B3D2E' },
  shield: { bg: '#3D2E0B' },
  help: { bg: '#2E1E5E' },
  logout: { bg: '#3B1A1A' },
  trendingup: { bg: '#0B3D2E' },
  calculator: { bg: '#3D2E0B' },
  transfer: { bg: '#1E3A5F' },
  repeat: { bg: '#2E1E5E' },
};

const SettingsRow = ({
  iconName,
  title,
  subtitle,
  rightLabel,
  rightElement,
  onPress,
  showDivider = true,
}) => {
  const theme = useThemeColors();
  const IconComponent = ICONS[iconName];
  const isDark = useIsDarkMode();
  const iconThemes = isDark ? DARK_ICON_THEMES : LIGHT_ICON_THEMES;
  const iconTheme = iconThemes[iconName] ?? { bg: theme.surfaceContainer };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      {IconComponent ? (
        <View style={[styles.iconBox, { backgroundColor: iconTheme.bg }]}>
          <IconComponent
            size={wp(4.5)}
            color={theme.primary}
            strokeWidth={1.8}
          />
        </View>
      ) : null}

      <View style={styles.textWrap}>
        <Label type="bodySmall" weight="semiBold" color="textMain">
          {title}
        </Label>
        {subtitle ? (
          <Label
            type="bodyXs"
            weight="regular"
            color="textMuted"
            style={styles.subtitle}
          >
            {subtitle}
          </Label>
        ) : null}
      </View>

      <View style={styles.right}>
        {rightLabel ? (
          <Label type="bodySmall" weight="semiBold" color="primary">
            {rightLabel}
          </Label>
        ) : null}
        {rightElement ?? (
          <ChevronRight
            size={wp(4)}
            color={theme.textMuted}
            strokeWidth={1.8}
          />
        )}
      </View>

      {showDivider && (
        <View
          style={[styles.divider, { backgroundColor: theme.outlineVariant }]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
  },
  iconBox: {
    width: wp(9),
    height: wp(9),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  textWrap: {
    flex: 1,
  },
  subtitle: {
    marginTop: hp(0.3),
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: wp(16),
    right: 0,
    height: 0.5,
  },
});

export default SettingsRow;
