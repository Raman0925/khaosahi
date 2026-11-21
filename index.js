import { AppRegistry } from 'react-native';

import { App } from './src/app/App';
import { name as appName } from './app.json';
import './src/shared/notifications/register';

AppRegistry.registerComponent(appName, () => App);
