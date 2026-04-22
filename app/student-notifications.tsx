import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNav } from '@/components/student-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import {
  getNotificationFeed,
  markNotificationFeedAsRead,
  NotificationFeedItem,
  syncStudentUploadedNoteNotificationsFromStoredSession,
} from '@/constants/lecture-notifications';

function formatNotificationTime(value: string) {
  const date = new Date(value);

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
}

export default function StudentNotificationsScreen() {
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);

    try {
      await syncStudentUploadedNoteNotificationsFromStoredSession({
        promptForPermission: false,
      });
      const nextItems = await getNotificationFeed('student');
      setItems(nextItems);
      await markNotificationFeedAsRead('student');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <MaterialIcons name="notifications-active" size={16} color="#F8FBFF" />
                <ThemedText style={styles.badgeText}>Notifications</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <ThemedText type="title" style={styles.heroTitle}>
              Your notification center.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Lecture reminders, nightly updates, and newly uploaded notes appear here like a real app inbox.
            </ThemedText>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Recent alerts
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>
                  Scheduled and delivered Studify alerts for classes and uploaded notes.
                </ThemedText>
              </View>
              <Pressable onPress={() => void loadNotifications()} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={18} color="#113B63" />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.stateWrap}>
                <ActivityIndicator size="small" color="#113B63" />
                <ThemedText style={styles.stateText}>Loading notifications...</ThemedText>
              </View>
            ) : !items.length ? (
              <View style={styles.stateWrap}>
                <MaterialIcons name="notifications-none" size={26} color="#60758A" />
                <ThemedText style={styles.stateTitle}>No notifications yet</ThemedText>
                <ThemedText style={styles.stateText}>
                  Your lecture reminders will start showing here after they are scheduled.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {items.map((item) => {
                  const isDelivered = item.status === 'delivered';

                  return (
                    <Pressable
                      key={`${item.audience}-${item.key}`}
                      onPress={() =>
                        router.push(
                          item.screen as
                            | '/student-dashboard'
                            | '/student-timetable'
                            | '/student-notifications'
                            | '/student-notes'
                        )
                      }
                      style={[styles.notificationCard, isDelivered && styles.notificationCardDelivered]}>
                      <View style={[styles.notificationIconWrap, isDelivered && styles.notificationIconWrapDelivered]}>
                        <MaterialIcons
                          name={
                            item.type === 'lecture'
                              ? 'schedule'
                              : item.type === 'note'
                                ? 'menu-book'
                                : 'notifications-active'
                          }
                          size={22}
                          color={isDelivered ? '#F8FBFF' : '#113B63'}
                        />
                      </View>
                      <View style={styles.notificationBody}>
                        <View style={styles.notificationTopRow}>
                          <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
                          <View style={[styles.statusChip, isDelivered && styles.statusChipDelivered]}>
                            <ThemedText style={[styles.statusChipText, isDelivered && styles.statusChipTextDelivered]}>
                              {isDelivered ? 'Delivered' : 'Scheduled'}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.notificationText}>{item.body}</ThemedText>
                        <ThemedText style={styles.notificationTime}>
                          {isDelivered ? 'Delivered' : 'Scheduled'} • {formatNotificationTime(isDelivered ? item.deliveredAt || item.scheduledFor : item.scheduledFor)}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
        <StudentBottomNav activeRoute="/student-notifications" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  screen: {
    flex: 1,
  },
  content: {
    gap: 22,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  heroCard: {
    backgroundColor: '#113B63',
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroGlowLarge: {
    backgroundColor: '#1E5D8C',
    borderRadius: 999,
    height: 220,
    position: 'absolute',
    right: -80,
    top: -40,
    width: 220,
  },
  heroGlowSmall: {
    backgroundColor: '#7AD7F0',
    borderRadius: 999,
    height: 100,
    left: -20,
    position: 'absolute',
    top: 120,
    width: 100,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dashboardButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dashboardButtonText: {
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#F8FBFF',
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(248,251,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  panelTitle: {
    color: '#132238',
  },
  panelSubtitle: {
    color: '#60758A',
    marginTop: 4,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stateWrap: {
    alignItems: 'center',
    borderColor: '#D7E0EA',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  stateTitle: {
    color: '#132238',
    fontSize: 18,
    fontWeight: '800',
  },
  stateText: {
    color: '#60758A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  listWrap: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  notificationCardDelivered: {
    borderColor: '#8EE3F5',
  },
  notificationIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  notificationIconWrapDelivered: {
    backgroundColor: '#113B63',
  },
  notificationBody: {
    flex: 1,
    gap: 8,
  },
  notificationTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  notificationTitle: {
    color: '#132238',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  notificationText: {
    color: '#60758A',
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    color: '#60758A',
    fontSize: 12,
    fontWeight: '700',
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF2FA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipDelivered: {
    backgroundColor: '#DDEEFE',
  },
  statusChipText: {
    color: '#113B63',
    fontSize: 11,
    fontWeight: '800',
  },
  statusChipTextDelivered: {
    color: '#113B63',
  },
});
