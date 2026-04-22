import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionRole = 'student' | 'faculty';

export type SessionUser = {
  fullName?: string;
  email: string;
  role: SessionRole;
  department?: string;
};

export type SessionData = {
  token?: string;
  user: SessionUser;
};

const SESSION_KEY = 'studify_session';

export async function saveSession(session: SessionData) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getSession() {
  const storedValue = await AsyncStorage.getItem(SESSION_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as SessionData;
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
