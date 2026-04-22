import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNav } from '@/components/student-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';

type SubjectCard = {
  _id?: string;
  department?: string;
  facultyId?: string;
  facultyName?: string;
  semester?: number;
  subjectCode?: string;
  subjectId?: string;
  subjectName: string;
};

const classroomThemes = [
  { accent: '#1B4F8A', soft: '#DCEEFF' },
  { accent: '#6A3FB3', soft: '#EEE3FF' },
  { accent: '#0E7C66', soft: '#DDF7F0' },
  { accent: '#BA5A24', soft: '#FFE9DB' },
  { accent: '#B2386E', soft: '#FFE3F0' },
  { accent: '#375F9A', soft: '#E2EBFF' },
] as const;

export default function StudentAssignmentsScreen() {
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const headerStats = useMemo(() => {
    const facultyCount = new Set(subjects.map((subject) => subject.facultyId || subject.facultyName || subject.subjectId)).size;

    return {
      facultyCount,
      subjectCount: subjects.length,
    };
  }, [subjects]);

  const loadSubjects = async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/subjects`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to load classroom subjects.');
      }

      setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.name === 'AbortError'
          ? 'Classroom request timed out. Restart the backend and try again.'
          : error instanceof Error
            ? error.message
            : 'Could not load the classroom right now.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadSubjects();
  }, []);

  const openSubject = (subject: SubjectCard) => {
    if (!subject.subjectId) {
      Alert.alert('Classroom unavailable', 'This subject is missing a subject id, so the classroom cannot open yet.');
      return;
    }

    router.push({
      pathname: '/student-classroom/[subjectId]',
      params: {
        subjectId: subject.subjectId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadSubjects(true)} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <MaterialIcons name="assignment" size={16} color="#F8FBFF" />
                <ThemedText style={styles.badgeText}>Classroom</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="assignment" size={34} color="#F8FBFF" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Your classrooms
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Google Classroom-style subject spaces powered by the live subjects collection.
            </ThemedText>

            <View style={styles.heroMetricRow}>
              <View style={styles.heroMetricCard}>
                <ThemedText style={styles.heroMetricValue}>{headerStats.subjectCount}</ThemedText>
                <ThemedText style={styles.heroMetricLabel}>Active subjects</ThemedText>
              </View>
              <View style={styles.heroMetricCard}>
                <ThemedText style={styles.heroMetricValue}>{headerStats.facultyCount}</ThemedText>
                <ThemedText style={styles.heroMetricLabel}>Faculty guides</ThemedText>
              </View>
              <View style={styles.heroMetricCard}>
                <ThemedText style={styles.heroMetricValue}>Sem 5</ThemedText>
                <ThemedText style={styles.heroMetricLabel}>Current batch</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Pressable onPress={() => void loadSubjects(true)} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={18} color="#113B63" />
              </Pressable>
              <ThemedText type="subtitle" style={styles.panelTitle}>
                Classroom stream
              </ThemedText>
              <ThemedText style={styles.panelSubtitle}>
                Six predefined subject spaces from the database.
              </ThemedText>
            </View>

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color="#113B63" />
                <ThemedText style={styles.stateTitle}>Loading classrooms</ThemedText>
                <ThemedText style={styles.stateDescription}>Fetching subject spaces from Atlas.</ThemedText>
              </View>
            ) : errorMessage ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrapError}>
                  <MaterialIcons name="wifi-off" size={28} color="#9A3D3D" />
                </View>
                <ThemedText style={styles.stateTitle}>Could not load classroom</ThemedText>
                <ThemedText style={styles.stateDescription}>{errorMessage}</ThemedText>
                <Pressable onPress={() => void loadSubjects()} style={styles.retryButton}>
                  <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
                </Pressable>
              </View>
            ) : subjects.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrap}>
                  <MaterialIcons name="class" size={28} color="#113B63" />
                </View>
                <ThemedText style={styles.stateTitle}>No classroom subjects yet</ThemedText>
                <ThemedText style={styles.stateDescription}>
                  Add records to the subjects collection and they will appear here automatically.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.classroomGrid}>
                {subjects.map((subject, index) => {
                  const theme = classroomThemes[index % classroomThemes.length];
                  const titleInitial = subject.subjectName?.charAt(0)?.toUpperCase() || 'S';

                  return (
                    <Pressable
                      key={subject._id || subject.subjectId || `${subject.subjectCode}-${index}`}
                      onPress={() => openSubject(subject)}
                      style={styles.classroomCard}>
                      <View style={[styles.classroomBanner, { backgroundColor: theme.accent }]}>
                        <View style={styles.bannerTopRow}>
                          <View style={[styles.subjectCodeChip, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                            <ThemedText style={styles.subjectCodeText}>
                              {subject.subjectCode || subject.subjectId || 'CS'}
                            </ThemedText>
                          </View>
                        </View>

                        <ThemedText style={styles.classroomTitle}>{subject.subjectName}</ThemedText>
                        <ThemedText style={styles.classroomSubtitle}>{subject.department || 'CS'} department</ThemedText>
                      </View>

                      <View style={styles.classroomBody}>
                        <View style={styles.teacherRow}>
                          <View style={[styles.teacherAvatar, { backgroundColor: theme.soft }]}>
                            <ThemedText style={[styles.teacherAvatarText, { color: theme.accent }]}>
                              {titleInitial}
                            </ThemedText>
                          </View>
                          <View style={styles.teacherTextWrap}>
                            <ThemedText style={styles.teacherLabel}>Class teacher</ThemedText>
                            <ThemedText style={styles.teacherName}>{subject.facultyName || 'Faculty to be assigned'}</ThemedText>
                          </View>
                        </View>

                        <View style={styles.classroomFooter}>
                          <View style={styles.footerMetaRow}>
                            <MaterialIcons name="badge" size={16} color="#60758A" />
                            <ThemedText style={styles.footerMetaText}>{subject.subjectId || 'Subject id unavailable'}</ThemedText>
                          </View>
                          <MaterialIcons name="arrow-forward" size={18} color="#60758A" />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        <StudentBottomNav activeRoute="/student-assignments" />
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
    paddingBottom: 156,
    paddingHorizontal: 20,
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
    color: '#F8FBFF',
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(248,251,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 320,
  },
  heroMetricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMetricCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    flex: 1,
    gap: 6,
    padding: 14,
  },
  heroMetricValue: {
    color: '#F8FBFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroMetricLabel: {
    color: 'rgba(248,251,255,0.72)',
    fontSize: 12,
    lineHeight: 16,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  panelHeader: {
    marginBottom: 18,
    paddingRight: 54,
    position: 'relative',
  },
  panelTitle: {
    color: '#132238',
  },
  panelSubtitle: {
    color: '#60758A',
    lineHeight: 20,
    marginTop: 4,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 42,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  stateIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.1)',
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
    color: '#132238',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 14,
    textAlign: 'center',
  },
  stateDescription: {
    color: '#60758A',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#113B63',
    borderRadius: 16,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#F8FBFF',
    fontSize: 14,
    fontWeight: '800',
  },
  classroomGrid: {
    gap: 14,
  },
  classroomCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  classroomBanner: {
    minHeight: 128,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bannerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 18,
  },
  subjectCodeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subjectCodeText: {
    color: '#F8FBFF',
    fontSize: 12,
    fontWeight: '800',
  },
  classroomTitle: {
    color: '#F8FBFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    maxWidth: 230,
  },
  classroomSubtitle: {
    color: 'rgba(248,251,255,0.78)',
    fontSize: 13,
    marginTop: 8,
  },
  classroomBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  teacherRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  teacherAvatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  teacherAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  teacherTextWrap: {
    flex: 1,
  },
  teacherLabel: {
    color: '#60758A',
    fontSize: 12,
    marginBottom: 4,
  },
  teacherName: {
    color: '#132238',
    fontSize: 15,
    fontWeight: '700',
  },
  classroomFooter: {
    alignItems: 'center',
    borderTopColor: '#E2E8F0',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
  },
  footerMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerMetaText: {
    color: '#60758A',
    fontSize: 13,
  },
});
