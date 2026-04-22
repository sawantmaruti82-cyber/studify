import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

type ClassroomSubject = {
  department?: string;
  facultyId?: string;
  facultyName?: string;
  semester?: number;
  subjectCode?: string;
  subjectId?: string;
  subjectName: string;
};

type ClassroomAssignment = {
  _id?: string;
  assignedToAll?: boolean;
  createdAt?: string;
  createdByFacultyName?: string;
  description?: string;
  dueDate?: string;
  facultyName?: string;
  status?: string;
  title: string;
};

function formatDate(value?: string) {
  if (!value) {
    return 'No due date';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'No due date';
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentClassroomSubjectScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();
  const [subject, setSubject] = useState<ClassroomSubject | null>(null);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const assignmentStats = useMemo(() => {
    const completedCount = assignments.filter((assignment) => (assignment.status || '').toLowerCase() === 'completed').length;
    const pendingCount = assignments.filter((assignment) => (assignment.status || '').toLowerCase() === 'pending').length;

    return {
      completedCount,
      pendingCount,
      totalCount: assignments.length,
    };
  }, [assignments]);

  const loadClassroom = useCallback(async (refreshing = false) => {
    if (!subjectId) {
      setErrorMessage('This classroom is missing a subject id.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/classroom/${subjectId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to load this classroom.');
      }

      setSubject(data.subject ?? null);
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.name === 'AbortError'
          ? 'Classroom request timed out. Restart the backend and try again.'
          : error instanceof Error
            ? error.message
            : 'Could not load this classroom right now.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [subjectId]);

  useEffect(() => {
    void loadClassroom();
  }, [loadClassroom]);

  const openAssignment = (assignment: ClassroomAssignment) => {
    if (!assignment._id) {
      Alert.alert('Assignment unavailable', 'This assignment is missing its id, so it cannot open yet.');
      return;
    }

    router.push({
      pathname: '/student-assignment-view/[assignmentId]',
      params: {
        assignmentId: assignment._id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadClassroom(true)} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={18} color="#F8FBFF" />
                <ThemedText style={styles.backButtonText}>Classroom</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="class" size={34} color="#F8FBFF" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              {subject?.subjectName || 'Subject classroom'}
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {subject?.facultyName || 'Faculty not assigned'} | {subject?.subjectCode || subject?.subjectId || 'Subject'}
            </ThemedText>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>{assignmentStats.totalCount}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Total tasks</ThemedText>
              </View>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>{assignmentStats.completedCount}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Completed</ThemedText>
              </View>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>Sem {subject?.semester || 5}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Current batch</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Pressable onPress={() => void loadClassroom(true)} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={18} color="#113B63" />
              </Pressable>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Assigned work
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>
                  Real assignments for this subject, like a subject view in Google Classroom.
                </ThemedText>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color="#113B63" />
                <ThemedText style={styles.stateTitle}>Loading assigned work</ThemedText>
                <ThemedText style={styles.stateDescription}>Fetching this classroom from Atlas.</ThemedText>
              </View>
            ) : errorMessage ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrapError}>
                  <MaterialIcons name="wifi-off" size={28} color="#9A3D3D" />
                </View>
                <ThemedText style={styles.stateTitle}>Could not load classroom</ThemedText>
                <ThemedText style={styles.stateDescription}>{errorMessage}</ThemedText>
                <Pressable onPress={() => void loadClassroom()} style={styles.retryButton}>
                  <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
                </Pressable>
              </View>
            ) : assignments.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrap}>
                  <MaterialIcons name="assignment-turned-in" size={28} color="#113B63" />
                </View>
                <ThemedText style={styles.stateTitle}>No assigned work yet</ThemedText>
                <ThemedText style={styles.stateDescription}>
                  This classroom is ready. Faculty assignments for this subject will appear here automatically.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.assignmentList}>
                {assignments.map((assignment) => (
                  <Pressable
                    key={assignment._id || `${assignment.title}-${assignment.dueDate}`}
                    onPress={() => openAssignment(assignment)}
                    style={styles.assignmentCard}>
                    <View style={styles.assignmentTopRow}>
                      <View style={styles.assignmentIconWrap}>
                        <MaterialIcons name="assignment" size={20} color="#113B63" />
                      </View>
                      <View style={styles.assignmentTitleWrap}>
                        <ThemedText style={styles.assignmentTitle}>{assignment.title}</ThemedText>
                        <ThemedText style={styles.assignmentMeta}>
                          Posted by {assignment.createdByFacultyName || assignment.facultyName || subject?.facultyName || 'Faculty'}
                        </ThemedText>
                      </View>
                      <View style={styles.statusChip}>
                        <ThemedText style={styles.statusChipText}>{assignment.status || 'pending'}</ThemedText>
                      </View>
                    </View>

                    <ThemedText style={styles.assignmentDescription}>
                      {assignment.description || 'No assignment description was provided.'}
                    </ThemedText>

                    <View style={styles.assignmentFooter}>
                      <View style={styles.assignmentFooterRow}>
                        <MaterialIcons name="event" size={16} color="#60758A" />
                        <ThemedText style={styles.assignmentFooterText}>Due {formatDate(assignment.dueDate)}</ThemedText>
                      </View>
                      <View style={styles.assignmentFooterRow}>
                        <MaterialIcons name="groups" size={16} color="#60758A" />
                        <ThemedText style={styles.assignmentFooterText}>
                          {assignment.assignedToAll ? 'Assigned to all students' : 'Targeted assignment'}
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                ))}
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
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
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
    marginBottom: 18,
    maxWidth: 320,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStatCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    flex: 1,
    padding: 14,
  },
  heroStatValue: {
    color: '#F8FBFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroStatLabel: {
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
    maxWidth: 260,
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
  assignmentList: {
    gap: 12,
  },
  assignmentCard: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  assignmentTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  assignmentIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  assignmentTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  assignmentTitle: {
    color: '#132238',
    fontSize: 16,
    fontWeight: '800',
  },
  assignmentMeta: {
    color: '#60758A',
    fontSize: 12,
    marginTop: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F2FF',
    borderColor: '#BCD4F5',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipText: {
    color: '#113B63',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  assignmentDescription: {
    color: '#4B6075',
    fontSize: 14,
    lineHeight: 21,
  },
  assignmentFooter: {
    gap: 10,
    marginTop: 14,
  },
  assignmentFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  assignmentFooterText: {
    color: '#60758A',
    fontSize: 13,
  },
});
