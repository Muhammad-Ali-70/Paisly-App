import {
  SENTRY_DSN,
  POSTHOG_KEY,
  POSTHOG_HOST,
  APP_ENV,
  BASE_URL_DEV,
  BASE_URL_ANDROID_EMULATOR,
  BASE_URL_PROD_ONRENDER,
  BASE_URL_PROD_RAILWAY,
  GOOGLE_WEB_CLIENT_ID,
} from '@env';

const productionURL = () =>
  APP_ENV === 'production-railway' ? BASE_URL_PROD_RAILWAY : BASE_URL_PROD_ONRENDER;

// Release builds always talk to production, whatever APP_ENV says: a release
// pointed at a dev (http) URL would fail every request with cleartext blocked.
// Dev URLs only exist inside `if (__DEV__)`, which the release minifier drops,
// so they don't end up in the shipped bundle either.
const getBaseURL = () => {
  if (__DEV__) {
    if (APP_ENV === 'production-onrender' || APP_ENV === 'production-railway') {
      return productionURL();
    }
    if (APP_ENV === 'android-emulator') return BASE_URL_ANDROID_EMULATOR;
    return BASE_URL_DEV;
  }
  return productionURL();
};

const BASE_URL = getBaseURL();

if (__DEV__) {
  console.log('[ENV] APP_ENV:', APP_ENV);
  console.log('[ENV] BASE_URL:', BASE_URL);
} else if (!/^https:\/\//.test(BASE_URL ?? '')) {
  // Loud in Sentry/logcat rather than a silently broken release
  console.error('[ENV] Release BASE_URL is not https:', BASE_URL);
}

export const ENV = {
  SENTRY_DSN,
  POSTHOG_KEY,
  POSTHOG_HOST: POSTHOG_HOST ?? 'https://us.i.posthog.com',
  BASE_URL,
  GOOGLE_WEB_CLIENT_ID,
  // Release vs debug build, not .env: a release can never run with Sentry off
  IS_DEV: __DEV__,
};
