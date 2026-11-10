import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import apiClient from '@services/apiClient';
import { storage } from '@services/storage';
import BottomSheet from '../ui/BottomSheet';
import PrimaryButton from '../ui/PrimaryButton';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';

// "Later" hides the optional prompt for this many days, per version, so a newer
// release still prompts straight away.
const SNOOZE_KEY = 'update_prompt_snooze';
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

const isSnoozed = version => {
  try {
    const s = JSON.parse(storage.getString(SNOOZE_KEY) ?? 'null');
    return s?.version === version && Date.now() < s.until;
  } catch {
    return false;
  }
};

const openStore = () => {
  const id = DeviceInfo.getBundleId();
  Linking.openURL(`market://details?id=${id}`).catch(() =>
    Linking.openURL(`https://play.google.com/store/apps/details?id=${id}`).catch(
      () => {},
    ),
  );
};

/**
 * Asks the server (GET /app/version) on launch and on every return to the
 * foreground whether this build is outdated. Below minVersionCode the prompt
 * can't be dismissed; below latestVersionCode it can be snoozed. Any failure
 * (offline, server asleep) shows nothing — never block the app on this check.
 */
const AppUpdatePrompt = () => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [prompt, setPrompt] = useState(null); // { forced, version, message }

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    let inFlight = false;

    const check = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const { data } = await apiClient.get('/app/version');
        const cfg = data?.data?.android;
        const current = Number(DeviceInfo.getBuildNumber());
        if (!cfg || !current) return;

        if (current < cfg.minVersionCode) {
          setPrompt({ forced: true, version: cfg.latestVersionCode, message: cfg.message });
        } else if (current < cfg.latestVersionCode && !isSnoozed(cfg.latestVersionCode)) {
          setPrompt({ forced: false, version: cfg.latestVersionCode, message: cfg.message });
        } else {
          setPrompt(null);
        }
      } catch {
        // Silent: the next foreground retries.
      } finally {
        inFlight = false;
      }
    };

    check();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, []);

  if (!prompt) return null;

  const later = () => {
    storage.set(
      SNOOZE_KEY,
      JSON.stringify({ version: prompt.version, until: Date.now() + SNOOZE_MS }),
    );
    setPrompt(null);
  };

  return (
    <BottomSheet
      visible
      // Forced: back button and backdrop taps do nothing
      onClose={prompt.forced ? () => {} : later}
      title={prompt.forced ? 'Update required' : 'Update available'}
    >
      <View style={styles.body}>
        <Label type="bodySmall" color="textMuted" style={styles.text}>
          {prompt.forced
            ? 'This version of Paisly is no longer supported. Please update to keep using the app.'
            : 'A new version of Paisly is available with improvements and fixes.'}
        </Label>
        {!!prompt.message && (
          <Label type="bodySmall" color="textMain" style={styles.text}>
            {prompt.message}
          </Label>
        )}
        <PrimaryButton label="Update now" onPress={openStore} />
        {!prompt.forced && (
          <PrimaryButton variant="ghost" label="Later" onPress={later} />
        )}
      </View>
    </BottomSheet>
  );
};

const createStyles = () =>
  StyleSheet.create({
    body: { paddingHorizontal: wp(5), gap: hp(1) },
    text: { lineHeight: 20, marginBottom: hp(1) },
  });

export default AppUpdatePrompt;
