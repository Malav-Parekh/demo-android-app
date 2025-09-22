/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import './background'; // Import background handler

AppRegistry.registerComponent(appName, () => App);
