import axios from 'axios';
import { ENV } from '../config/env';

// The session token lives in the auth store: in memory always, on disk only when
// "Remember me" is on. Lazy require avoids a circular import at module init.
const getSessionToken = () => require('../store/useAuthStore').default.getState().token;

// Resolved from APP_ENV in .env (android-emulator / development / production-onrender).
// Changing .env requires restarting Metro with --reset-cache.
const apiClient = axios.create({
  baseURL: ENV.BASE_URL,
  // Render's free tier spins the server down when idle; the first request
  // after a cold start can take 20-30s to wake it back up.
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    // The server buckets days/months in this zone (it runs in UTC)
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
  },
});

apiClient.interceptors.request.use(
  config => {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => {
    // Sliding session: the server renews tokens older than a day. Stored the
    // same way as at login (persisted only with "Remember me" on).
    const renewed = response.headers?.['x-session-token'];
    if (renewed && getSessionToken()) {
      require('../store/useAuthStore').default.setState({ token: renewed });
    }
    return response;
  },
  error => {
    const errorInfo = handleAxiosError(error);
    console.error('[API Error]', errorInfo.message);

    // Expired/invalid session: clear local auth so the app returns to the
    // login screen instead of silently failing every request.
    // (Guarded on a stored token so failed logins don't trigger it.)
    if (errorInfo.status === 401 && getSessionToken()) {
      require('../store/useAuthStore').default.getState().logout();
    }

    return Promise.reject(errorInfo);
  },
);

/**
 * What every API call rejects with. A real Error (not a plain object) so Sentry
 * gets a stack and a proper title instead of "Non-Error promise rejection";
 * callers keep reading .message / .status / .data / .type as before.
 */
export class ApiError extends Error {
  constructor({ type, status, message, data }) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.data = data;
  }
}

export const handleAxiosError = error => {
  if (error.response) {
    return new ApiError({
      type: 'server',
      status: error.response.status,
      message:
        error.response.data?.message ||
        error.response.statusText ||
        'Server error',
      data: error.response.data,
    });
  } else if (error.request) {
    return new ApiError({
      type: 'network',
      status: null,
      message: 'No response from server. Check your connection.',
      data: null,
    });
  } else {
    return new ApiError({
      type: 'client',
      status: null,
      message: error.message || 'Something went wrong',
      data: null,
    });
  }
};

export default apiClient;
