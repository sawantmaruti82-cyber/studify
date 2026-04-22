import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FacultyBottomNav } from '@/components/faculty-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import {
  getNotificationFeed,
  markNotificationFeedAsRead,
  NotificationFeedItem,
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

export default function FacultyNotificationsScreen() {
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextItems = await getNotificationFeed('faculty');
      setItems(nextItems);
      await markNotificationFeedAsRead('faculty');
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
                <MaterialIcons name="notifications-active" size={16} color="#F7FBF9" />
                <ThemedText style={styles.badgeText}>Faculty notifications</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/faculty-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F7FBF9" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <ThemedText type="title" style={styles.heroTitle}>
              Lecture alerts in one place.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Your nightly tomorrow-lecture reminders and delivered faculty alerts appear here like a real inbox.
            </ThemedText>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Reminder feed
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>
                  Scheduled and delivered lecture reminders for your faculty account.
                </ThemedText>
              </View>
              <Pressable onPress={() => void loadNotifications()} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={18} color="#0E5A43" />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.stateWrap}>
                <ActivityIndicator size="small" color="#0E5A43" />
                <ThemedText style={styles.stateText}>Loading notifications...</ThemedText>
              </View>
            ) : !items.length ? (
              <View style={styles.stateWrap}>
                <MaterialIcons name="notifications-none" size={26} color="#5A756B" />
                <ThemedText style={styles.stateTitle}>No reminders yet</ThemedText>
                <ThemedText style={styles.stateText}>
                  Your nightly lecture summary will appear here after the faculty reminder is scheduled.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.listWrap}>
                {items.map((item) => {
                  const isDelivered = item.status === 'delivered';

                  return (
                    <Pressable
                      key={`${item.audience}-${item.key}`}
                      onPress={() => router.push(item.screen as '/faculty-dashboard' | '/faculty-notifications')}
                      style={[styles.notificationCard, isDelivered && styles.notificationCardDelivered]}>
                      <View style={[styles.notificationIconWrap, isDelivered && styles.notificationIconWrapDelivered]}>
                        <MaterialIcons
                          name={item.type === 'lecture' ? 'schedule' : 'notifications-active'}
                          size={22}
                          color={isDelivered ? '#F7FBF9' : '#0E5A43'}
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
        <FacultyBottomNav activeRoute="/faculty-notifications" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8F5',
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
    backgroundColor: '#0E5A43',
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroGlowLarge: {
    backgroundColor: '#198A66',
    borderRadius: 999,
    height: 220,
    position: 'absolute',
    right: -80,
    top: -40,
    width: 220,
  },
  heroGlowSmall: {
    backgroundColor: '#7FE3BE',
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
    color: '#F7FBF9',
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
    color: '#F7FBF9',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#F7FBF9',
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(247,251,249,0.82)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
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
    color: '#17332A',
  },
  panelSubtitle: {
    color: '#5A756B',
    marginTop: 4,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stateWrap: {
    alignItems: 'center',
    borderColor: '#D6E4DC',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  stateTitle: {
    color: '#17332A',
    fontSize: 18,
    fontWeight: '800',
  },
  stateText: {
    color: '#5A756B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  listWrap: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  notificationCardDelivered: {
    borderColor: '#9BE4C9',
  },
  notificationIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  notificationIconWrapDelivered: {
    backgroundColor: '#0E5A43',
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
    color: '#17332A',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  notificationText: {
    color: '#5A756B',
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    color: '#5A756B',
    fontSize: 12,
    fontWeight: '700',
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E7F5EE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipDelivered: {
    backgroundColor: '#D8F4E8',
  },
  statusChipText: {
    color: '#0E5A43',
    fontSize: 11,
    fontWeight: '800',
  },
  statusChipTextDelivered: {
    color: '#0E5A43',
  },
});
