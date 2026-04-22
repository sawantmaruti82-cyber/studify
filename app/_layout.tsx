import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';

import {
  configureLectureNotificationChannel,
  recordDeliveredNotification,
  syncLectureNotificationsFromStoredSession,
  syncStudentUploadedNoteNotificationsFromStoredSession,
} from '@/constants/lecture-notifications';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    let active = true;
    let noteSyncInterval: ReturnType<typeof setInterval> | null = null;
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const payload = notification.request.content.data ?? {};

      void recordDeliveredNotification({
        audience: typeof payload.userRole === 'string' ? payload.userRole : undefined,
        body: notification.request.content.body,
        key: typeof payload.reminderKey === 'string' ? payload.reminderKey : undefined,
        screen: typeof payload.screen === 'string' ? payload.screen : undefined,
        title: notification.request.content.title,
        type:
          payload.reminderType === 'lecture' ||
          payload.reminderType === 'nightly' ||
          payload.reminderType === 'note'
            ? payload.reminderType
            : undefined,
      });
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const payload = response.notification.request.content.data ?? {};

      void recordDeliveredNotification({
        audience: typeof payload.userRole === 'string' ? payload.userRole : undefined,
        body: response.notification.request.content.body,
        key: typeof payload.reminderKey === 'string' ? payload.reminderKey : undefined,
        screen: typeof payload.screen === 'string' ? payload.screen : undefined,
        title: response.notification.request.content.title,
        type:
          payload.reminderType === 'lecture' ||
          payload.reminderType === 'nightly' ||
          payload.reminderType === 'note'
            ? payload.reminderType
            : undefined,
      });
    });
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void syncStudentUploadedNoteNotificationsFromStoredSession({
          promptForPermission: false,
        }).catch((error) => {
          console.warn('Studify note notification sync skipped:', error);
        });
      }
    });

    const prepareNotifications = async () => {
      try {
        await configureLectureNotificationChannel();
        const result = await syncLectureNotificationsFromStoredSession({
          promptForPermission: false,
        });
        await syncStudentUploadedNoteNotificationsFromStoredSession({
          promptForPermission: false,
        });

        if (!active || result.skipped) {
          // continue to interval setup while app stays active
        }

        noteSyncInterval = setInterval(() => {
          void syncStudentUploadedNoteNotificationsFromStoredSession({
            promptForPermission: false,
          }).catch((error) => {
            console.warn('Studify note notification sync skipped:', error);
          });
        }, 60000);
      } catch (error) {
        console.warn('Studify notification setup skipped:', error);
      }
    };

    void prepareNotifications();

    return () => {
      active = false;
      if (noteSyncInterval) {
        clearInterval(noteSyncInterval);
      }
      appStateSubscription.remove();
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="student-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="student-profile" options={{ headerShown: false }} />
        <Stack.Screen name="student-attendance" options={{ headerShown: false }} />
        <Stack.Screen name="student-assignments" options={{ headerShown: false }} />
        <Stack.Screen name="student-classroom/[subjectId]" options={{ headerShown: false }} />
        <Stack.Screen name="student-assignment-view/[assignmentId]" options={{ headerShown: false }} />
        <Stack.Screen name="student-notes" options={{ headerShown: false }} />
        <Stack.Screen name="student-notes/[subjectId]" options={{ headerShown: false }} />
        <Stack.Screen name="student-note-view/[noteId]" options={{ headerShown: false }} />
        <Stack.Screen name="student-notifications" options={{ headerShown: false }} />
        <Stack.Screen name="student-notices" options={{ headerShown: false }} />
        <Stack.Screen name="student-timetable" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-attendance" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-classroom" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-materials" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-notes" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-notes/[noteId]" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-notices" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-notifications" options={{ headerShown: false }} />
        <Stack.Screen name="faculty-schedule" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
