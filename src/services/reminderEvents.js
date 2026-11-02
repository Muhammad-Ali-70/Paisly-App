import notifee, { EventType } from '@notifee/react-native';
import useAuthStore from '../store/useAuthStore';

// A tap is routed through the same pending-action path as launcher shortcuts,
// so it works from a cold start, a warm start and before login.
let lastPressAt = 0;
let initialChecked = false;

const openFromNotification = notification => {
  const action = notification?.data?.action;
  if (!action) return;
  // The same tap can be reported by both the background handler and
  // getInitialNotification when the app was launched by it
  const now = Date.now();
  if (now - lastPressAt < 2000) return;
  lastPressAt = now;
  useAuthStore.getState().setPendingAction(action);
};

/** Registered for both onForegroundEvent and onBackgroundEvent. */
export const handleNotificationEvent = async ({ type, detail }) => {
  if (type === EventType.PRESS) openFromNotification(detail.notification);
};

/** The notification that launched the app from a killed state, once per process. */
export const handleLaunchNotification = async () => {
  if (initialChecked) return;
  initialChecked = true;
  const initial = await notifee.getInitialNotification();
  if (initial) openFromNotification(initial.notification);
};
