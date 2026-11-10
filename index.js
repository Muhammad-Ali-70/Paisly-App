/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { name as appName } from './app.json';
import { handleNotificationEvent } from './src/services/reminderEvents';
import { widgetTaskHandler } from './src/widget/widgetTaskHandler';

// Must be registered at the top level, outside any component. Foreground covers
// taps while the app is open or warm in the background; background covers the rest.
notifee.onBackgroundEvent(handleNotificationEvent);
notifee.onForegroundEvent(handleNotificationEvent);
registerWidgetTaskHandler(widgetTaskHandler);

AppRegistry.registerComponent(appName, () => App);
