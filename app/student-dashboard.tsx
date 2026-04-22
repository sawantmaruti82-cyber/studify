import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNav } from '@/components/student-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import {
  clearStudentLectureNotifications,
  syncStudentUploadedNoteNotificationsFromStoredSession,
  syncStudentLectureNotificationsFromStoredSession,
} from '@/constants/lecture-notifications';
import { clearSession } from '@/constants/session';
import {
  buildScheduleRows,
  formatCollegeRange,
  formatCollegeTime,
  getCurrentDayName,
  getPreviewGroups,
  groupTimetableByDay,
  TimetableEntry,
} from '@/constants/timetable';

const quickActions = [
  {
    icon: 'schedule',
    label: 'Timetable',
    hint: 'See today\'s lectures and labs',
    route: '/student-timetable',
  },
  {
    icon: 'assignment',
    label: 'Classroom',
    hint: 'Open subject work, notes, and tasks',
    route: '/student-assignments',
  },
  {
    icon: 'fact-check',
    label: 'Attendance',
    hint: 'Check your current attendance',
    route: '/student-attendance',
  },
  {
    icon: 'campaign',
    label: 'Notices',
    hint: 'Read department announcements',
    route: '/student-notices',
  },
] as const;

const menuItems = [
  { icon: 'person', label: 'Profile', route: '/student-profile' },
  { icon: 'schedule', label: 'Timetable', route: '/student-timetable' },
  { icon: 'assignment', label: 'Classroom', route: '/student-assignments' },
  { icon: 'menu-book', label: 'Notes', route: '/student-notes' },
  { icon: 'fact-check', label: 'Attendance', route: '/student-attendance' },
  { icon: 'notifications-active', label: 'Notifications', route: '/student-notifications' },
  { icon: 'campaign', label: 'Notices', route: '/student-notices' },
] as const;

export default function StudentDashboard() {
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = Dimensions.get('screen').width || windowWidth;
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isTimetableLoading, setIsTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState('');
  const [previewDayIndex, setPreviewDayIndex] = useState(0);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuTranslateX = useState(() => new Animated.Value(-screenWidth))[0];
  const backdropOpacity = useState(() => new Animated.Value(0))[0];
  const showTapMessage = (title: string, detail: string) => {
    Alert.alert(title, detail);
  };

  const today = useMemo(() => getCurrentDayName(), []);

  const groupedTimetable = useMemo(() => groupTimetableByDay(timetable), [timetable]);
  const previewGroups = useMemo(() => getPreviewGroups(groupedTimetable, today, 3), [groupedTimetable, today]);
  const selectedPreview = previewGroups[previewDayIndex] ?? null;
  const todaySchedule = useMemo(
    () => groupedTimetable.find((group) => group.day === today)?.items ?? [],
    [groupedTimetable, today]
  );
  const heroMetrics = useMemo(() => {
    const firstLecture = todaySchedule[0];
    const lastLecture = todaySchedule[todaySchedule.length - 1];

    return [
      {
        icon: 'today' as const,
        value: `${todaySchedule.length}`,
        label: 'Today lectures',
        detail:
          todaySchedule.length > 0
            ? `${todaySchedule[0]?.day} schedule is ready`
            : 'No lectures scheduled today',
      },
      {
        icon: 'wb-sunny' as const,
        value: firstLecture ? formatCollegeTime(firstLecture.startTime) : '--',
        label: 'First lecture',
        detail: firstLecture ? `${firstLecture.subjectName} | ${firstLecture.room || 'Room TBA'}` : 'No first lecture today',
      },
      {
        icon: 'nightlight-round' as const,
        value: lastLecture ? formatCollegeRange(lastLecture.startTime, lastLecture.endTime) : '--',
        label: 'Final slot',
        detail: lastLecture ? `${lastLecture.subjectName} | ${lastLecture.room || 'Room TBA'}` : 'No final lecture today',
      },
    ];
  }, [todaySchedule]);

  const handleLogout = async () => {
    await clearStudentLectureNotifications();
    await clearSession();
    router.replace('/login');
  };

  const animateMenuOpen = () => {
    Animated.parallel([
      Animated.spring(menuTranslateX, {
        toValue: 0,
        damping: 22,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openMenu = () => {
    setIsMenuVisible(true);
    menuTranslateX.setValue(-screenWidth);
    backdropOpacity.setValue(0);
    animateMenuOpen();
  };

  const closeMenu = (onClosed?: () => void) => {
    Animated.parallel([
      Animated.timing(menuTranslateX, {
        toValue: -screenWidth,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMenuVisible(false);
      onClosed?.();
    });
  };

  const navigateFromMenu = (route: (typeof menuItems)[number]['route']) => {
    closeMenu(() => {
      router.push(route);
    });
  };

  const logoutFromMenu = () => {
    closeMenu(() => {
      void handleLogout();
    });
  };

  const menuPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx < -8,
        onPanResponderMove: (_event, gestureState) => {
          const nextTranslate = Math.max(-screenWidth, Math.min(0, gestureState.dx));
          menuTranslateX.setValue(nextTranslate);
          backdropOpacity.setValue(1 + nextTranslate / screenWidth);
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dx < -90 || gestureState.vx < -0.7) {
            Animated.parallel([
              Animated.timing(menuTranslateX, {
                toValue: -screenWidth,
                duration: 220,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
              }),
            ]).start(() => {
              setIsMenuVisible(false);
            });
            return;
          }

          Animated.parallel([
            Animated.spring(menuTranslateX, {
              toValue: 0,
              damping: 22,
              stiffness: 220,
              mass: 0.9,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 220,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [backdropOpacity, menuTranslateX, screenWidth]
  );

  const loadTimetable = async () => {
    setIsTimetableLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/timetable`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to load timetable. Restart the backend server and try again.');
      }

      const nextTimetable = Array.isArray(data.timetable) ? data.timetable : [];
      setTimetable(nextTimetable);
      void syncStudentLectureNotificationsFromStoredSession({
        promptForPermission: false,
        timetable: nextTimetable,
      }).catch((notificationError) => {
        console.warn('Studify timetable reminders could not refresh:', notificationError);
      });
      setTimetableError('');
    } catch (error) {
      setTimetableError(
        error instanceof Error && error.name === 'AbortError'
          ? 'Timetable request timed out. Restart the backend and try again.'
          : error instanceof Error
            ? error.message
            : 'Could not load timetable right now. Restart the backend and try again.'
      );
    } finally {
      setIsTimetableLoading(false);
    }
  };

  useEffect(() => {
    void loadTimetable();
  }, []);

  useEffect(() => {
    void syncStudentUploadedNoteNotificationsFromStoredSession({
      promptForPermission: false,
    }).catch((error) => {
      console.warn('Studify uploaded note notifications could not refresh:', error);
    });
  }, []);

  useEffect(() => {
    setPreviewDayIndex(0);
  }, [previewGroups]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <Modal
          animationType="none"
          onRequestClose={() => closeMenu()}
          presentationStyle="overFullScreen"
          statusBarTranslucent
          transparent
          visible={isMenuVisible}>
          <View style={styles.menuModalRoot}>
            <Animated.View style={[styles.menuBackdrop, { opacity: backdropOpacity }]}>
              <Pressable onPress={() => closeMenu()} style={StyleSheet.absoluteFillObject} />
            </Animated.View>
            <Animated.View
              {...menuPanResponder.panHandlers}
              style={[styles.menuPanel, { transform: [{ translateX: menuTranslateX }], width: screenWidth }]}>
              <View style={styles.menuHeaderTopRow}>
                <Pressable onPress={() => closeMenu()} style={styles.menuBackButton}>
                  <MaterialIcons name="arrow-back" size={22} color="#132238" />
                  <ThemedText style={styles.menuBackText}>Back</ThemedText>
                </Pressable>
                <View style={styles.menuBrandBadge}>
                  <View style={styles.menuBrandIconWrap}>
                    <MaterialIcons name="school" size={16} color="#F8FBFF" />
                  </View>
                  <ThemedText style={styles.menuBrandText}>Studify</ThemedText>
                </View>
              </View>
              <View style={styles.menuGrabber} />

              <ScrollView
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.menuList}>
                  {menuItems.map((item) => (
                    <Pressable
                      key={item.label}
                      onPress={() => navigateFromMenu(item.route)}
                      style={styles.menuItem}>
                      <View style={styles.menuItemIconWrap}>
                        <MaterialIcons name={item.icon} size={20} color="#113B63" />
                      </View>
                      <ThemedText style={styles.menuItemText}>{item.label}</ThemedText>
                      <MaterialIcons name="chevron-right" size={20} color="#60758A" />
                    </Pressable>
                  ))}
                </View>

                <Pressable onPress={logoutFromMenu} style={styles.menuLogout}>
                  <View style={styles.menuLogoutIconWrap}>
                    <MaterialIcons name="logout" size={20} color="#A33A3A" />
                  </View>
                  <ThemedText style={styles.menuLogoutText}>Logout</ThemedText>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <Pressable onPress={openMenu} style={styles.badge}>
                <MaterialIcons name="school" size={16} color="#F8FBFF" />
                <ThemedText style={styles.badgeText}>Student Dashboard</ThemedText>
              </Pressable>
              <Pressable onPress={handleLogout} style={styles.logoutButton}>
                <MaterialIcons name="logout" size={18} color="#F8FBFF" />
                <ThemedText style={styles.logoutText}>Logout</ThemedText>
              </Pressable>
            </View>

            <ThemedText type="title" style={styles.heroTitle}>
              Welcome back to Studify.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Keep track of lectures, classroom work, attendance, and Computer Science updates in one place.
            </ThemedText>

            <View style={styles.metricRow}>
              {heroMetrics.map((metric) => (
                <View key={metric.label} style={styles.metricCard}>
                  <View style={styles.metricIconWrap}>
                    <MaterialIcons name={metric.icon} size={18} color="#F8FBFF" />
                  </View>
                  <ThemedText style={styles.metricValue}>{metric.value}</ThemedText>
                  <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
                  <ThemedText style={styles.metricDetail}>{metric.detail}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Quick actions
              </ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                Jump straight into your daily student tools.
              </ThemedText>
            </View>
          </View>

          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route)}
                style={styles.actionCard}>
                <View style={styles.actionIconWrap}>
                  <MaterialIcons name={action.icon} size={24} color="#113B63" />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  {action.label}
                </ThemedText>
                <ThemedText style={styles.cardSubtitle}>{action.hint}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Schedule preview
              </ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                Same college-day view, limited to 3 days.
              </ThemedText>
            </View>
          </View>

          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Pressable
                disabled={previewDayIndex <= 0}
                onPress={() => setPreviewDayIndex((current) => Math.max(0, current - 1))}
                style={[styles.scheduleArrowButton, previewDayIndex <= 0 && styles.scheduleArrowButtonDisabled]}>
                <MaterialIcons
                  name="chevron-left"
                  size={24}
                  color={previewDayIndex <= 0 ? '#A9B8C6' : '#113B63'}
                />
              </Pressable>
              <View style={styles.scheduleTitleWrap}>
                <ThemedText style={styles.scheduleDayTitle}>{selectedPreview?.day || 'Live preview'}</ThemedText>
                <ThemedText style={styles.scheduleDaySubtitle}>
                  {selectedPreview?.day === today ? 'Today' : 'Upcoming lecture day'}
                </ThemedText>
              </View>
              <Pressable
                disabled={previewDayIndex >= previewGroups.length - 1 || previewGroups.length === 0}
                onPress={() => setPreviewDayIndex((current) => Math.min(previewGroups.length - 1, current + 1))}
                style={[
                  styles.scheduleArrowButton,
                  (previewDayIndex >= previewGroups.length - 1 || previewGroups.length === 0) &&
                    styles.scheduleArrowButtonDisabled,
                ]}>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={
                    previewDayIndex >= previewGroups.length - 1 || previewGroups.length === 0
                      ? '#A9B8C6'
                      : '#113B63'
                  }
                />
              </Pressable>
            </View>

            {isTimetableLoading ? (
              <View style={styles.scheduleStateWrap}>
                <ActivityIndicator size="small" color="#113B63" />
                <ThemedText style={styles.scheduleStateText}>Loading live timetable...</ThemedText>
              </View>
            ) : timetableError ? (
              <View style={styles.scheduleStateWrap}>
                <MaterialIcons name="wifi-off" size={22} color="#9A3D3D" />
                <ThemedText style={styles.scheduleErrorText}>{timetableError}</ThemedText>
                <Pressable onPress={() => void loadTimetable()} style={styles.scheduleRetryButton}>
                  <ThemedText style={styles.scheduleRetryText}>Retry</ThemedText>
                </Pressable>
              </View>
            ) : !previewGroups.length ? (
              <View style={styles.scheduleStateWrap}>
                <MaterialIcons name="event-busy" size={22} color="#60758A" />
                <ThemedText style={styles.scheduleStateText}>No timetable entries found.</ThemedText>
              </View>
            ) : (
              <View style={[styles.daySection, selectedPreview?.day === today && styles.daySectionToday]}>
                <View style={styles.entriesWrap}>
                  {buildScheduleRows(selectedPreview?.items || [], selectedPreview?.day || '').map((row) =>
                    row.kind === 'break' ? (
                        <View key={row.key} style={styles.breakCard}>
                          <View style={styles.breakLine} />
                          <View style={styles.breakContent}>
                            <ThemedText style={styles.breakLabel}>{row.label}</ThemedText>
                            <ThemedText style={styles.breakTime}>{formatCollegeRange(row.startTime, row.endTime)}</ThemedText>
                          </View>
                          <View style={styles.breakLine} />
                        </View>
                      ) : row.kind === 'free' ? (
                      <View key={row.key} style={styles.freeCard}>
                        <View style={styles.entryTimeBlock}>
                          <ThemedText style={styles.entryTime}>{formatCollegeTime(row.startTime)}</ThemedText>
                          <ThemedText style={styles.entryTimeDivider}>to</ThemedText>
                          <ThemedText style={styles.entryTime}>{formatCollegeTime(row.endTime)}</ThemedText>
                        </View>
                        <View style={styles.entryBody}>
                          <ThemedText style={styles.entryTitle}>{row.label}</ThemedText>
                          <View style={styles.entryMetaRow}>
                            <MaterialIcons name="event-seat" size={16} color="#60758A" />
                            <ThemedText style={styles.entryMetaText}>
                              No lecture is assigned in this slot.
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        key={row.key}
                            onPress={() =>
                              showTapMessage(
                                row.entry.subjectName,
                                `${formatCollegeRange(row.entry.startTime, row.entry.endTime)} in ${row.entry.room || 'TBA'}`
                              )
                            }
                            style={styles.entryCard}>
                        <View style={styles.entryTimeBlock}>
                          <ThemedText style={styles.entryTime}>{formatCollegeTime(row.entry.startTime)}</ThemedText>
                          <ThemedText style={styles.entryTimeDivider}>to</ThemedText>
                          <ThemedText style={styles.entryTime}>{formatCollegeTime(row.entry.endTime)}</ThemedText>
                        </View>
                        <View style={styles.entryBody}>
                          <ThemedText style={styles.entryTitle}>{row.entry.subjectName}</ThemedText>
                          <View style={styles.entryMetaRow}>
                            <MaterialIcons name="badge" size={16} color="#60758A" />
                            <ThemedText style={styles.entryMetaText}>
                              {row.entry.subjectId || 'Subject code unavailable'}
                            </ThemedText>
                          </View>
                          <View style={styles.entryMetaRow}>
                            <MaterialIcons name="location-on" size={16} color="#60758A" />
                            <ThemedText style={styles.entryMetaText}>
                              {row.entry.room || 'Room not assigned'}
                            </ThemedText>
                          </View>
                        </View>
                      </Pressable>
                    )
                  )}
                </View>
              </View>
            )}
          </View>

        </ScrollView>
        <StudentBottomNav />
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
  menuModalRoot: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,17,28,0.28)',
  },
  menuPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FBFF',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 26,
    shadowColor: '#08111C',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    overflow: 'hidden',
  },
  menuHeaderTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  menuBackButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuBackText: {
    color: '#132238',
    fontSize: 14,
    fontWeight: '700',
  },
  menuBrandBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuBrandIconWrap: {
    alignItems: 'center',
    backgroundColor: '#113B63',
    borderRadius: 10,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  menuBrandText: {
    color: '#132238',
    fontSize: 14,
    fontWeight: '800',
  },
  menuGrabber: {
    alignSelf: 'center',
    backgroundColor: '#D7E0EA',
    borderRadius: 999,
    height: 4,
    marginBottom: 22,
    width: 56,
  },
  menuScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  menuList: {
    gap: 10,
  },
  menuItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuItemIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  menuItemText: {
    color: '#132238',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  menuLogout: {
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderColor: '#F0C8C8',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuLogoutIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(163,58,58,0.1)',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  menuLogoutText: {
    color: '#A33A3A',
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    gap: 22,
    paddingHorizontal: 20,
    paddingBottom: 156,
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
  logoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#F8FBFF',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(248,251,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
    maxWidth: 320,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    flex: 1,
    gap: 6,
    padding: 14,
  },
  metricIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    height: 32,
    justifyContent: 'center',
    marginBottom: 2,
    width: 32,
  },
  metricValue: {
    color: '#F8FBFF',
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: 'rgba(248,251,255,0.74)',
    fontSize: 12,
    lineHeight: 16,
  },
  metricDetail: {
    color: 'rgba(248,251,255,0.62)',
    fontSize: 11,
    lineHeight: 15,
    minHeight: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#132238',
  },
  sectionSubtitle: {
    color: '#60758A',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 22,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 138,
    padding: 16,
    width: '47%',
  },
  actionIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    marginBottom: 16,
    width: 46,
  },
  cardTitle: {
    color: '#132238',
  },
  cardSubtitle: {
    color: '#60758A',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  scheduleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  scheduleArrowButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  scheduleArrowButtonDisabled: {
    backgroundColor: 'rgba(17,59,99,0.04)',
  },
  daySection: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  daySectionToday: {
    borderColor: '#8EE3F5',
    shadowColor: '#113B63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  dayHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  scheduleTitleWrap: {
    minWidth: 0,
  },
  scheduleDayTitle: {
    color: '#132238',
    fontSize: 19,
    fontWeight: '800',
  },
  scheduleDaySubtitle: {
    color: '#60758A',
    fontSize: 13,
    marginTop: 2,
  },
  scheduleStateWrap: {
    alignItems: 'center',
    borderColor: '#D7E0EA',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  scheduleStateText: {
    color: '#60758A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  scheduleErrorText: {
    color: '#9A3D3D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  scheduleRetryButton: {
    backgroundColor: '#113B63',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scheduleRetryText: {
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '800',
  },
  entriesWrap: {
    gap: 12,
  },
  breakCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  breakLine: {
    backgroundColor: '#D7E0EA',
    flex: 1,
    height: 1,
  },
  breakContent: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  breakLabel: {
    color: '#113B63',
    fontSize: 12,
    fontWeight: '800',
  },
  breakTime: {
    color: '#60758A',
    fontSize: 11,
    marginTop: 2,
  },
  freeCard: {
    backgroundColor: '#F4F7FB',
    borderColor: '#D7E0EA',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  entryTimeBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 96,
    paddingHorizontal: 10,
    width: 82,
  },
  entryTime: {
    color: '#113B63',
    fontSize: 15,
    fontWeight: '800',
  },
  entryTimeDivider: {
    color: '#60758A',
    fontSize: 12,
    marginVertical: 4,
  },
  entryBody: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  entryMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  entryTitle: {
    color: '#132238',
    fontSize: 17,
    fontWeight: '800',
  },
  entryMetaText: {
    color: '#60758A',
    flex: 1,
    fontSize: 14,
  },
});
