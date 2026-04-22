import { Platform } from 'react-native';

const defaultHost = Platform.select({
  android: '10.0.2.2',
  ios: '127.0.0.1',
  default: 'localhost',
});

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || `http://${defaultHost}:4000/api`).replace(/\/$/, '');
