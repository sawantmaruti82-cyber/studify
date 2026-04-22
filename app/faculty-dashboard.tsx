import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FacultyBottomNav } from '@/components/faculty-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import {
  clearStudentLectureNotifications,
  getUnreadNotificationCount,
} from '@/constants/lecture-notifications';
import { clearSession, getSession } from '@/constants/session';
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
    icon: 'fact-check',
    label: 'Take Attendance',
    hint: 'Mark attendance for your next class',
    route: '/faculty-attendance',
  },
  {
    icon: 'upload-file',
    label: 'Add Notes',
    hint: 'Share lecture notes and practical sheets',
    route: '/faculty-notes',
  },
  {
    icon: 'campaign',
    label: 'Notices',
    hint: 'Read HOD and department notices',
    route: '/faculty-notices',
  },
  {
    icon: 'event-note',
    label: 'Timetable',
    hint: 'Review classes and workload for today',
    route: '/faculty-schedule',
  },
] as const;

type SubjectMeta = {
  facultyId?: string;
  facultyName?: string;
  noteCount?: number;
  subjectId?: string;
  subjectName?: string;
};

export default function FacultyDashboard() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isTimetableLoading, setIsTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState('');
  const [previewDayIndex, setPreviewDayIndex] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<string[]>([]);
  const [teacherFacultyIds, setTeacherFacultyIds] = useState<string[]>([]);
  const [subjectFacultyNames, setSubjectFacultyNames] = useState<Record<string, string>>({});
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
  const isTeacherLecture = (entry: TimetableEntry) =>
    (entry.subjectId ? teacherSubjectIds.includes(entry.subjectId) : false) ||
    (entry.facultyId ? teacherFacultyIds.includes(entry.facultyId) : false);
  const ownTodaySchedule = useMemo(
    () =>
      todaySchedule.filter(
        (entry) =>
          (entry.subjectId ? teacherSubjectIds.includes(entry.subjectId) : false) ||
          (entry.facultyId ? teacherFacultyIds.includes(entry.facultyId) : false)
      ),
    [teacherFacultyIds, teacherSubjectIds, todaySchedule]
  );
  const nextLecture = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return ownTodaySchedule.find((entry) => {
      const [hours, minutes] = entry.startTime.split(':').map((value) => Number(value));
      return hours * 60 + minutes >= currentMinutes;
    });
  }, [ownTodaySchedule]);
  const heroMetrics = useMemo(() => {
    return [
      {
        value: `${ownTodaySchedule.length}`,
        label: 'Classes today',
        detail: ownTodaySchedule.length ? 'Your lecture count for today' : 'No lectures assigned today',
      },
      {
        value: nextLecture ? formatCollegeTime(nextLecture.startTime) : '--',
        label: 'Next lecture',
        detail: nextLecture ? `${nextLecture.subjectName} | ${nextLecture.room || 'Room TBA'}` : 'No more lectures left today',
      },
      {
        value: `${unreadNotificationsCount}`,
        label: 'Unread notifications',
        detail: unreadNotificationsCount ? 'Delivered alerts waiting in your notification inbox' : 'No unread notifications right now',
      },
    ];
  }, [nextLecture, ownTodaySchedule.length, unreadNotificationsCount]);

  const handleLogout = async () => {
    await clearStudentLectureNotifications();
    await clearSession();
    router.replace('/login');
  };

  const refreshUnreadNotifications = useCallback(async () => {
    const unreadCount = await getUnreadNotificationCount('faculty');
    setUnreadNotificationsCount(unreadCount);
  }, []);

  const getDaySubtitle = (day: string) => {
    const matchingIndex = previewGroups.findIndex((group) => group.day === day);

    if (matchingIndex === 0) {
      return 'Today';
    }

    if (matchingIndex === 1) {
      return 'Tomorrow';
    }

    if (matchingIndex === 2) {
      return 'Day after tomorrow';
    }

    return 'Upcoming lecture day';
  };

  const loadFacultyTimetable = async () => {
    setIsTimetableLoading(true);

    try {
      const session = await getSession();
      const teacherName = session?.user?.fullName?.trim() || '';

      if (!teacherName) {
        throw new Error('Faculty session details are missing. Please log in again.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const [notesSubjectsResponse, overviewResponse, timetableResponse, unreadCount] = await Promise.all([
        fetch(`${API_URL}/notes/subjects`, { signal: controller.signal }),
        fetch(`${API_URL}/faculty/overview`, { signal: controller.signal }),
        fetch(`${API_URL}/timetable`, { signal: controller.signal }),
        getUnreadNotificationCount('faculty'),
      ]);

      clearTimeout(timeoutId);

      const notesSubjectsData = await notesSubjectsResponse.json().catch(() => null);
      const overviewData = await overviewResponse.json().catch(() => null);
      const timetableData = await timetableResponse.json().catch(() => null);

      if (!notesSubjectsResponse.ok || !notesSubjectsData?.success) {
        throw new Error(notesSubjectsData?.message || 'Unable to load faculty subjects right now.');
      }

      if (!overviewResponse.ok || !overviewData?.success) {
        throw new Error(overviewData?.message || 'Unable to load faculty overview right now.');
      }

      if (!timetableResponse.ok || !timetableData?.success) {
        throw new Error(timetableData?.message || 'Unable to load timetable right now.');
      }

      const allSubjects = Array.isArray(notesSubjectsData.subjects) ? notesSubjectsData.subjects : [];
      const teacherSubjects = allSubjects.filter(
        (subject: SubjectMeta) =>
          subject.facultyName?.trim().toLowerCase() === teacherName.toLowerCase()
      );

      const allowedFacultyIds = teacherSubjects
        .map((subject: SubjectMeta) => subject.facultyId?.trim())
        .filter(Boolean) as string[];
      const allowedSubjectIds = teacherSubjects
        .map((subject: SubjectMeta) => subject.subjectId?.trim())
        .filter(Boolean) as string[];
      const facultyNameMap = allSubjects.reduce<Record<string, string>>((accumulator, subject: SubjectMeta) => {
        if (subject.subjectId) {
          accumulator[subject.subjectId] = subject.facultyName?.trim() || '';
        }

        return accumulator;
      }, {});
      setTeacherFacultyIds(allowedFacultyIds);
      setTeacherSubjectIds(allowedSubjectIds);
      setSubjectFacultyNames(facultyNameMap);
      setUnreadNotificationsCount(unreadCount);
      setTimetable(Array.isArray(timetableData.timetable) ? timetableData.timetable : []);
      setTimetableError('');
    } catch (error) {
      setTeacherFacultyIds([]);
      setTeacherSubjectIds([]);
      setSubjectFacultyNames({});
      setUnreadNotificationsCount(0);
      setTimetable([]);
      setTimetableError(
        error instanceof Error && error.name === 'AbortError'
          ? 'Faculty timetable request timed out. Restart the backend and try again.'
          : error instanceof Error
            ? error.message
            : 'Could not load faculty timetable right now.'
      );
    } finally {
      setIsTimetableLoading(false);
    }
  };

  useEffect(() => {
    void loadFacultyTimetable();
  }, []);

  useEffect(() => {
    setPreviewDayIndex(0);
  }, [previewGroups]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnreadNotifications();
    }, [refreshUnreadNotifications])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />

          <View style={styles.heroTopRow}>
            <View style={styles.badge}>
              <MaterialIcons name="co-present" size={16} color="#F7FBF9" />
              <ThemedText style={styles.badgeText}>Faculty Dashboard</ThemedText>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <MaterialIcons name="logout" size={18} color="#F7FBF9" />
              <ThemedText style={styles.logoutText}>Logout</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="title" style={styles.heroTitle}>
            Manage classes with clarity.
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Handle attendance, notices, notes, and your next lectures for Computer Science.
          </ThemedText>

          <View style={styles.metricRow}>
            {heroMetrics.map((metric) => (
              <View key={metric.label} style={styles.metricCard}>
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
              Shortcuts for your main faculty tasks.
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
                <MaterialIcons name={action.icon} size={24} color="#0E5A43" />
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
              Today&apos;s lecture
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Today, tomorrow, and day-after lecture view for all classes. Your lectures are highlighted.
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
                color={previewDayIndex <= 0 ? '#A9B8C6' : '#0E5A43'}
              />
            </Pressable>
            <View style={styles.scheduleTitleWrap}>
              <ThemedText style={styles.scheduleDayTitle}>{selectedPreview?.day || 'Lecture preview'}</ThemedText>
              <ThemedText style={styles.scheduleDaySubtitle}>
                {selectedPreview ? getDaySubtitle(selectedPreview.day) : 'Upcoming lecture day'}
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
                    : '#0E5A43'
                }
              />
            </Pressable>
          </View>

          {isTimetableLoading ? (
            <View style={styles.scheduleStateWrap}>
              <ActivityIndicator size="small" color="#0E5A43" />
              <ThemedText style={styles.scheduleStateText}>Loading faculty timetable...</ThemedText>
            </View>
          ) : timetableError ? (
            <View style={styles.scheduleStateWrap}>
              <MaterialIcons name="wifi-off" size={22} color="#9A3D3D" />
              <ThemedText style={styles.scheduleErrorText}>{timetableError}</ThemedText>
              <Pressable onPress={() => void loadFacultyTimetable()} style={styles.scheduleRetryButton}>
                <ThemedText style={styles.scheduleRetryText}>Retry</ThemedText>
              </Pressable>
            </View>
          ) : !previewGroups.length ? (
            <View style={styles.scheduleStateWrap}>
              <MaterialIcons name="event-busy" size={22} color="#60756B" />
              <ThemedText style={styles.scheduleStateText}>No lectures are assigned for this faculty yet.</ThemedText>
            </View>
          ) : (
            <View style={[styles.daySection, selectedPreview?.day === today && styles.daySectionToday]}>
              <View style={styles.entriesWrap}>
                {buildScheduleRows(selectedPreview?.items || [], selectedPreview?.day || '').map((row) => {
                  if (row.kind === 'break') {
                    return (
                      <View key={row.key} style={styles.breakCard}>
                        <View style={styles.breakLine} />
                        <View style={styles.breakContent}>
                          <ThemedText style={styles.breakLabel}>{row.label}</ThemedText>
                          <ThemedText style={styles.breakTime}>
                            {formatCollegeRange(row.startTime, row.endTime)}
                          </ThemedText>
                        </View>
                        <View style={styles.breakLine} />
                      </View>
                    );
                  }

                  if (row.kind === 'free') {
                    return (
                      <View key={row.key} style={styles.freeCard}>
                        <View style={styles.entryTimeBlock}>
                          <ThemedText style={styles.entryTime}>{formatCollegeTime(row.startTime)}</ThemedText>
                          <ThemedText style={styles.entryTimeDivider}>to</ThemedText>
                          <ThemedText style={styles.entryTime}>{formatCollegeTime(row.endTime)}</ThemedText>
                        </View>
                        <View style={styles.entryBody}>
                          <ThemedText style={styles.entryTitle}>{row.label}</ThemedText>
                          <View style={styles.entryMetaRow}>
                            <MaterialIcons name="event-seat" size={16} color="#60756B" />
                            <ThemedText style={styles.entryMetaText}>
                              No lecture is assigned in this slot.
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  const isActive = isTeacherLecture(row.entry);

                  return (
                    <Pressable
                      key={row.key}
                      onPress={() =>
                        showTapMessage(
                          row.entry.subjectName,
                          `${formatCollegeRange(row.entry.startTime, row.entry.endTime)} in ${row.entry.room || 'TBA'}`
                        )
                      }
                      style={[styles.entryCard, isActive && styles.entryCardActive]}>
                      <View style={[styles.entryTimeBlock, isActive && styles.entryTimeBlockActive]}>
                        <ThemedText style={[styles.entryTime, isActive && styles.entryTimeActive]}>
                          {formatCollegeTime(row.entry.startTime)}
                        </ThemedText>
                        <ThemedText style={[styles.entryTimeDivider, isActive && styles.entryTimeDividerActive]}>
                          to
                        </ThemedText>
                        <ThemedText style={[styles.entryTime, isActive && styles.entryTimeActive]}>
                          {formatCollegeTime(row.entry.endTime)}
                        </ThemedText>
                      </View>
                      <View style={styles.entryBody}>
                        <View style={styles.entryTitleRow}>
                          <ThemedText style={[styles.entryTitle, isActive && styles.entryTitleActive]}>
                            {row.entry.subjectName}
                          </ThemedText>
                          {isActive ? (
                            <View style={styles.entryHighlightChip}>
                              <ThemedText style={styles.entryHighlightText}>Your lecture</ThemedText>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.entryMetaRow}>
                          <MaterialIcons name="badge" size={16} color={isActive ? '#F7FBF9' : '#60756B'} />
                          <ThemedText style={[styles.entryMetaText, isActive && styles.entryMetaTextActive]}>
                            {row.entry.subjectId || 'Subject code unavailable'}
                          </ThemedText>
                        </View>
                        <View style={styles.entryMetaRow}>
                          <MaterialIcons
                            name="person-outline"
                            size={16}
                            color={isActive ? '#F7FBF9' : '#60756B'}
                          />
                          <ThemedText style={[styles.entryMetaText, isActive && styles.entryMetaTextActive]}>
                            {subjectFacultyNames[row.entry.subjectId || ''] || row.entry.facultyId || 'Faculty not assigned'}
                          </ThemedText>
                        </View>
                        <View style={styles.entryMetaRow}>
                          <MaterialIcons name="location-on" size={16} color={isActive ? '#F7FBF9' : '#60756B'} />
                          <ThemedText style={[styles.entryMetaText, isActive && styles.entryMetaTextActive]}>
                            {row.entry.room || 'Room not assigned'}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

      </ScrollView>
      <FacultyBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8F5',
  },
  content: {
    gap: 22,
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    color: '#F7FBF9',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#F7FBF9',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(247,251,249,0.82)',
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
    padding: 14,
  },
  metricValue: {
    color: '#F7FBF9',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLabel: {
    color: 'rgba(247,251,249,0.74)',
    fontSize: 12,
    lineHeight: 16,
  },
  metricDetail: {
    color: 'rgba(247,251,249,0.62)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
    minHeight: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#17332A',
  },
  sectionSubtitle: {
    color: '#5A756B',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 22,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 138,
    padding: 16,
    width: '47%',
  },
  actionIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    marginBottom: 16,
    width: 46,
  },
  listWrap: {
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
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
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  scheduleArrowButtonDisabled: {
    backgroundColor: 'rgba(14,90,67,0.04)',
  },
  scheduleTitleWrap: {
    minWidth: 0,
  },
  scheduleDayTitle: {
    color: '#17332A',
    fontSize: 19,
    fontWeight: '800',
  },
  scheduleDaySubtitle: {
    color: '#5A756B',
    fontSize: 13,
    marginTop: 2,
  },
  scheduleStateWrap: {
    alignItems: 'center',
    borderColor: '#D6E4DC',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  scheduleStateText: {
    color: '#5A756B',
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
    backgroundColor: '#0E5A43',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scheduleRetryText: {
    color: '#F7FBF9',
    fontSize: 13,
    fontWeight: '800',
  },
  daySection: {
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  daySectionToday: {
    borderColor: '#9BE4C9',
    shadowColor: '#0E5A43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
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
    backgroundColor: '#D6E4DC',
    flex: 1,
    height: 1,
  },
  breakContent: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  breakLabel: {
    color: '#0E5A43',
    fontSize: 12,
    fontWeight: '800',
  },
  breakTime: {
    color: '#5A756B',
    fontSize: 11,
    marginTop: 2,
  },
  freeCard: {
    backgroundColor: '#F3F8F5',
    borderColor: '#D6E4DC',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  listIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  listBody: {
    flex: 1,
    gap: 6,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  entryCardActive: {
    backgroundColor: '#0E8B5F',
    borderColor: '#0E8B5F',
    shadowColor: '#0E5A43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  entryTimeBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 96,
    paddingHorizontal: 10,
    width: 82,
  },
  entryTimeBlockActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  entryTime: {
    color: '#0E5A43',
    fontSize: 15,
    fontWeight: '800',
  },
  entryTimeDivider: {
    color: '#5A756B',
    fontSize: 12,
    marginVertical: 4,
  },
  entryTimeActive: {
    color: '#F7FBF9',
  },
  entryTimeDividerActive: {
    color: 'rgba(247,251,249,0.8)',
  },
  entryBody: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  entryTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#5A756B',
  },
  entryMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  entryTitle: {
    color: '#17332A',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  entryTitleActive: {
    color: '#F7FBF9',
  },
  entryHighlightChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.26)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  entryHighlightText: {
    color: '#F7FBF9',
    fontSize: 11,
    fontWeight: '800',
  },
  entryMetaText: {
    color: '#5A756B',
    flex: 1,
    fontSize: 14,
  },
  entryMetaTextActive: {
    color: 'rgba(247,251,249,0.88)',
  },
  cardTitle: {
    color: '#17332A',
  },
  cardSubtitle: {
    color: '#5A756B',
  },
});
