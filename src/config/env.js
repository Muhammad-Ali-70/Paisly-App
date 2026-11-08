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

const getBaseURL = () => {
  if (APP_ENV === 'production-onrender') return BASE_URL_PROD_ONRENDER;
  if (APP_ENV === 'production-railway') return BASE_URL_PROD_RAILWAY;
  if (APP_ENV === 'android-emulator') return BASE_URL_ANDROID_EMULATOR;

  return BASE_URL_DEV;
};

if (__DEV__) {
  console.log('[ENV] APP_ENV:', APP_ENV);
  console.log('[ENV] BASE_URL:', getBaseURL());
}

export const ENV = {
  SENTRY_DSN,
  POSTHOG_KEY,
  POSTHOG_HOST: POSTHOG_HOST ?? 'https://us.i.posthog.com',
  BASE_URL: getBaseURL(),
  GOOGLE_WEB_CLIENT_ID,
  // Anything not explicitly a production APP_ENV counts as dev
  IS_DEV: !String(APP_ENV ?? '').startsWith('production'),
};
