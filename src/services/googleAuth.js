import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { ENV } from '../config/env';

let configured = false;

const ensureConfigured = () => {
  if (configured) return;
  // webClientId makes Google return an ID token addressed to our backend.
  GoogleSignin.configure({ webClientId: ENV.GOOGLE_WEB_CLIENT_ID });
  configured = true;
};

// Maps native error codes to messages a user can act on.
const friendlyError = error => {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.IN_PROGRESS:
        return 'Google sign-in is already in progress';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services is unavailable or out of date on this device';
      case '7': // NETWORK_ERROR
        return 'No internet connection. Please try again.';
      case '10': // DEVELOPER_ERROR: SHA-1 / client ID mismatch in Google Cloud Console
        console.error('[googleAuth] DEVELOPER_ERROR: check SHA-1 fingerprints and webClientId');
        return 'Google sign-in is not available right now. Please use email instead.';
    }
  }
  return 'Google sign-in failed. Please try again.';
};

/**
 * Opens the Google account picker.
 * Resolves { idToken } on success or { cancelled: true } when the user backs out.
 * Throws an Error with a user-facing message otherwise.
 */
export const getGoogleIdToken = async () => {
  if (!ENV.GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Google sign-in is not configured');
  }
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Sign out first so the picker always shows, letting the user choose an account.
    await GoogleSignin.signOut().catch(() => {});
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return { cancelled: true };

    const idToken = response.data?.idToken;
    if (!idToken) throw new Error('missing idToken');
    return { idToken };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { cancelled: true };
    }
    console.error('[googleAuth] signIn failed:', error?.code, error?.message);
    throw new Error(friendlyError(error));
  }
};

// Best effort: a stale native Google session must never block a Paisly logout.
export const signOutGoogle = async () => {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch {}
};

// Used on account deletion so the app no longer appears under the user's Google connections.
export const revokeGoogle = async () => {
  try {
    ensureConfigured();
    await GoogleSignin.revokeAccess();
  } catch {}
};
