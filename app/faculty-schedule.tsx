import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FacultyBottomNav } from '@/components/faculty-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { getSession } from '@/constants/session';
import {
  buildScheduleRows,
  formatCollegeRange,
  formatCollegeTime,
  getCurrentDayName,
  groupTimetableByDay,
  TimetableEntry,
} from '@/constants/timetable';

type SubjectMeta = {
  facultyId?: string;
  facultyName?: string;
  subjectId?: string;
};

export default function FacultyScheduleScreen() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<string[]>([]);
  const [teacherFacultyIds, setTeacherFacultyIds] = useState<string[]>([]);
  const [subjectFacultyNames, setSubjectFacultyNames] = useState<Record<string, string>>({});

  const today = useMemo(() => getCurrentDayName(), []);
  const groupedTimetable = useMemo(() => groupTimetableByDay(timetable), [timetable]);
  const selectedSchedule = groupedTimetable[selectedDayIndex] ?? null;

  const isTeacherLecture = (entry: TimetableEntry) =>
    (entry.subjectId ? teacherSubjectIds.includes(entry.subjectId) : false) ||
    (entry.facultyId ? teacherFacultyIds.includes(entry.facultyId) : false);

  const loadTimetable = async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const session = await getSession();
      const teacherName = session?.user?.fullName?.trim() || '';

      if (!teacherName) {
        throw new Error('Faculty session details are missing. Please log in again.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const [subjectsResponse, timetableResponse] = await Promise.all([
        fetch(`${API_URL}/subjects`, { signal: controller.signal }),
        fetch(`${API_URL}/timetable`, { signal: controller.signal }),
      ]);

      clearTimeout(timeoutId);

      const subjectsData = await subjectsResponse.json().catch(() => null);
      const timetableData = await timetableResponse.json().catch(() => null);

      if (!subjectsResponse.ok || !subjectsData?.success) {
        throw new Error(subjectsData?.message || 'Unable to load faculty subjects right now.');
      }

      if (!timetableResponse.ok || !timetableData?.success) {
        throw new Error(timetableData?.message || 'Unable to load timetable right now.');
      }

      const allSubjects = Array.isArray(subjectsData.subjects) ? (subjectsData.subjects as SubjectMeta[]) : [];
      const teacherSubjects = allSubjects.filter(
        (subject) => subject.facultyName?.trim().toLowerCase() === teacherName.toLowerCase()
      );

      setTeacherFacultyIds(
        teacherSubjects.map((subject) => subject.facultyId?.trim()).filter(Boolean) as string[]
      );
      setTeacherSubjectIds(
        teacherSubjects.map((subject) => subject.subjectId?.trim()).filter(Boolean) as string[]
      );
      setSubjectFacultyNames(
        allSubjects.reduce<Record<string, string>>((accumulator, subject) => {
          if (subject.subjectId) {
            accumulator[subject.subjectId] = subject.facultyName?.trim() || '';
          }

          return accumulator;
        }, {})
      );

      setTimetable(Array.isArray(timetableData.timetable) ? timetableData.timetable : []);
      setErrorMessage('');
    } catch (error) {
      setTeacherFacultyIds([]);
      setTeacherSubjectIds([]);
      setSubjectFacultyNames({});
      setTimetable([]);
      setErrorMessage(
        error instanceof Error && error.name === 'AbortError'
          ? 'Timetable request timed out. Restart the backend and try again.'
          : error instanceof Error
            ? error.message
            : 'Could not load the timetable from the server.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTimetable();
  }, []);

  useEffect(() => {
    if (!groupedTimetable.length) {
      setSelectedDayIndex(0);
      return;
    }

    const nextIndex = groupedTimetable.findIndex((group) => group.day === today);
    setSelectedDayIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [groupedTimetable, today]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadTimetable(true)} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <MaterialIcons name="event-note" size={16} color="#F7FBF9" />
                <ThemedText style={styles.badgeText}>Timetable</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/faculty-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F7FBF9" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="event-note" size={34} color="#F7FBF9" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Live teaching timetable
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              All Computer Science lectures are shown here, with your own lectures highlighted for each day.
            </ThemedText>

            <View style={styles.todayChip}>
              <MaterialIcons name="today" size={16} color="#0E5A43" />
              <ThemedText style={styles.todayChipText}>Today: {today}</ThemedText>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelTopRow}>
              <View style={styles.panelHeaderText}>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Weekly overview
                </ThemedText>
              </View>
              <Pressable onPress={() => void loadTimetable(true)} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={18} color="#0E5A43" />
              </Pressable>
            </View>
            <ThemedText style={styles.panelSubtitle}>
              Every lecture is fetched from the live timetable, and your own lectures are highlighted in green.
            </ThemedText>

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color="#0E5A43" />
                <ThemedText style={styles.stateTitle}>Loading timetable</ThemedText>
                <ThemedText style={styles.stateDescription}>Fetching the latest schedule from Atlas.</ThemedText>
              </View>
            ) : errorMessage ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrapError}>
                  <MaterialIcons name="wifi-off" size={28} color="#9A3D3D" />
                </View>
                <ThemedText style={styles.stateTitle}>Could not load timetable</ThemedText>
                <ThemedText style={styles.stateDescription}>{errorMessage}</ThemedText>
                <Pressable onPress={() => void loadTimetable()} style={styles.retryButton}>
                  <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
                </Pressable>
              </View>
            ) : groupedTimetable.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrap}>
                  <MaterialIcons name="event-busy" size={28} color="#0E5A43" />
                </View>
                <ThemedText style={styles.stateTitle}>No timetable entries yet</ThemedText>
                <ThemedText style={styles.stateDescription}>
                  Add timetable records in Atlas and they will appear here automatically.
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.daySection, selectedSchedule?.day === today && styles.daySectionToday]}>
                <View style={styles.dayNavigator}>
                  <Pressable
                    disabled={selectedDayIndex <= 0}
                    onPress={() => setSelectedDayIndex((current) => Math.max(0, current - 1))}
                    style={[styles.dayArrowButton, selectedDayIndex <= 0 && styles.dayArrowButtonDisabled]}>
                    <MaterialIcons
                      name="chevron-left"
                      size={24}
                      color={selectedDayIndex <= 0 ? '#A9B8C6' : '#0E5A43'}
                    />
                  </Pressable>

                  <View style={styles.dayHeader}>
                    <ThemedText style={styles.dayTitle}>{selectedSchedule?.day}</ThemedText>
                    <ThemedText style={styles.daySubtitle}>
                      {selectedSchedule?.day === today ? 'Today | ' : ''}
                      {selectedSchedule?.items.length} class{selectedSchedule?.items.length === 1 ? '' : 'es'}
                    </ThemedText>
                  </View>

                  <Pressable
                    disabled={selectedDayIndex >= groupedTimetable.length - 1}
                    onPress={() =>
                      setSelectedDayIndex((current) => Math.min(groupedTimetable.length - 1, current + 1))
                    }
                    style={[
                      styles.dayArrowButton,
                      selectedDayIndex >= groupedTimetable.length - 1 && styles.dayArrowButtonDisabled,
                    ]}>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={selectedDayIndex >= groupedTimetable.length - 1 ? '#A9B8C6' : '#0E5A43'}
                    />
                  </Pressable>
                </View>

                <View style={styles.entriesWrap}>
                  {buildScheduleRows(selectedSchedule?.items || [], selectedSchedule?.day || '').map((row) => {
                    if (row.kind === 'break') {
                      return (
                        <View key={row.key} style={styles.breakCard}>
                          <View style={styles.breakLine} />
                          <View style={styles.breakContent}>
                            <ThemedText style={styles.breakLabel}>{row.label}</ThemedText>
                            <ThemedText style={styles.breakTime}>{formatCollegeRange(row.startTime, row.endTime)}</ThemedText>
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
                              <MaterialIcons name="event-seat" size={16} color="#5A756B" />
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
                      <View key={row.key} style={[styles.entryCard, isActive && styles.entryCardActive]}>
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
                            <MaterialIcons name="badge" size={16} color={isActive ? '#F7FBF9' : '#5A756B'} />
                            <ThemedText style={[styles.entryMetaText, isActive && styles.entryMetaTextActive]}>
                              {row.entry.subjectId || 'Subject code unavailable'}
                            </ThemedText>
                          </View>
                          <View style={styles.entryMetaRow}>
                            <MaterialIcons name="person-outline" size={16} color={isActive ? '#F7FBF9' : '#5A756B'} />
                            <ThemedText style={[styles.entryMetaText, isActive && styles.entryMetaTextActive]}>
                              {subjectFacultyNames[row.entry.subjectId || ''] || row.entry.facultyId || 'Faculty not assigned'}
                            </ThemedText>
                          </View>
                          <View style={styles.entryMetaRow}>
                            <MaterialIcons name="location-on" size={16} color={isActive ? '#F7FBF9' : '#5A756B'} />
                            <ThemedText style={[styles.entryMetaText, isActive && styles.entryMetaTextActive]}>
                              {row.entry.room || 'Room not assigned'}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <FacultyBottomNav />
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
    paddingBottom: 140,
    paddingHorizontal: 20,
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
    height: 120,
    left: -32,
    position: 'absolute',
    top: 116,
    width: 120,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
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
  heroIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    marginBottom: 18,
    width: 64,
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
    marginBottom: 18,
    maxWidth: 320,
  },
  todayChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D8F4E8',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  todayChipText: {
    color: '#0E5A43',
    fontSize: 13,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  panelTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  panelHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  panelTitle: {
    color: '#17332A',
  },
  panelSubtitle: {
    color: '#5A756B',
    lineHeight: 20,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 16,
    flexShrink: 0,
    height: 42,
    justifyContent: 'center',
    marginLeft: 8,
    width: 42,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  stateIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.1)',
    borderRadius: 22,
    height: 64,
    justifyContent: 'center',
    marginBottom: 18,
    width: 64,
  },
  stateIconWrapError: {
    alignItems: 'center',
    backgroundColor: 'rgba(154,61,61,0.12)',
    borderRadius: 22,
    height: 64,
    justifyContent: 'center',
    marginBottom: 18,
    width: 64,
  },
  stateTitle: {
    color: '#17332A',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  stateDescription: {
    color: '#5A756B',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0E5A43',
    borderRadius: 16,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#F7FBF9',
    fontSize: 14,
    fontWeight: '800',
  },
  dayNavigator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayArrowButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.08)',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  dayArrowButtonDisabled: {
    backgroundColor: 'rgba(14,90,67,0.04)',
  },
  daySection: {
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
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
  dayHeader: {
    alignItems: 'center',
    flex: 1,
  },
  dayTitle: {
    color: '#17332A',
    fontSize: 20,
    fontWeight: '800',
  },
  daySubtitle: {
    color: '#5A756B',
    fontSize: 13,
    marginTop: 2,
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
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
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
  entryTitle: {
    color: '#17332A',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  entryTitleActive: {
    color: '#F7FBF9',
  },
  entryMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  entryMetaText: {
    color: '#5A756B',
    flex: 1,
    fontSize: 14,
  },
  entryMetaTextActive: {
    color: 'rgba(247,251,249,0.88)',
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
});
