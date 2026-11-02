/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { handleNotificationEvent } from './src/services/reminderEvents';

// Must be registered at the top level, outside any component
notifee.onBackgroundEvent(handleNotificationEvent);

AppRegistry.registerComponent(appName, () => App);
