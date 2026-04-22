import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNav } from '@/components/student-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';

type SubjectMeta = {
  department?: string;
  facultyId?: string;
  facultyName?: string;
  semester?: number | string;
  subjectCode?: string;
  subjectId?: string;
  subjectName?: string;
};

type AssignmentItem = {
  _id?: string;
  assignedToAll?: boolean;
  createdAt?: string;
  createdByFacultyName?: string;
  description?: string;
  dueDate?: string;
  facultyId?: string;
  facultyName?: string;
  semester?: number | string;
  status?: string;
  subjectId?: string;
  subjectName?: string;
  targetScope?: string;
  title?: string;
  updatedAt?: string;
};

function formatDate(value?: string, withTime = false) {
  if (!value) {
    return withTime ? 'Not available' : 'No date';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return withTime ? 'Not available' : 'No date';
  }

  return parsedDate.toLocaleString('en-IN', {
    day: 'numeric',
    hour: withTime ? 'numeric' : undefined,
    minute: withTime ? '2-digit' : undefined,
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentAssignmentViewScreen() {
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId;

  const [assignment, setAssignment] = useState<AssignmentItem | null>(null);
  const [subject, setSubject] = useState<SubjectMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) {
        setErrorMessage('This assignment could not be identified.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch(`${API_URL}/classroom/item/${assignmentId}`);
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to load this assignment right now.');
        }

        setAssignment((data.assignment as AssignmentItem) || null);
        setSubject((data.subject as SubjectMeta) || null);
      } catch (error) {
        setAssignment(null);
        setSubject(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load this assignment right now.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadAssignment();
  }, [assignmentId, reloadKey]);

  const highlightStats = useMemo(() => {
    const dueLabel = assignment?.dueDate ? formatDate(assignment.dueDate) : 'No due date';
    const statusLabel = assignment?.status ? assignment.status : 'pending';
    const audienceLabel = assignment?.assignedToAll ? 'Whole class' : assignment?.targetScope || 'Selected batch';

    return {
      audienceLabel,
      dueLabel,
      statusLabel,
    };
  }, [assignment]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Pressable onPress={() => router.back()} style={styles.topButton}>
                <MaterialIcons name="arrow-back" size={18} color="#F8FBFF" />
                <ThemedText style={styles.topButtonText}>Back</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.topButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.topButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="assignment" size={30} color="#F8FBFF" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              {assignment?.title || 'Assignment'}
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {(subject?.subjectName || assignment?.subjectName || 'Subject') +
                ` | ${subject?.facultyName || assignment?.createdByFacultyName || assignment?.facultyName || 'Faculty'}`}
            </ThemedText>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="small" color="#113B63" />
              <ThemedText style={styles.stateTitle}>Loading assignment</ThemedText>
              <ThemedText style={styles.stateText}>Fetching the assignment details for this subject.</ThemedText>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateCard}>
              <MaterialIcons name="wifi-off" size={26} color="#9A3D3D" />
              <ThemedText style={styles.stateTitle}>Could not load assignment</ThemedText>
              <ThemedText style={styles.stateText}>{errorMessage}</ThemedText>
              <Pressable onPress={() => setReloadKey((current) => current + 1)} style={styles.retryButton}>
                <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.panel}>
                <ThemedText style={styles.panelLabel}>Assigned work</ThemedText>
                <ThemedText style={styles.panelTitle}>{assignment?.title || 'Assignment details'}</ThemedText>
                <ThemedText style={styles.panelMeta}>
                  {(subject?.subjectCode || assignment?.subjectId || 'Subject code') +
                    ` | Posted ${formatDate(assignment?.createdAt)}`}
                </ThemedText>

                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricValue}>{highlightStats.dueLabel}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Due date</ThemedText>
                  </View>
                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricValue}>{highlightStats.statusLabel}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Status</ThemedText>
                  </View>
                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricValue}>{subject?.semester || assignment?.semester || 5}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Semester</ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <ThemedText style={styles.sectionLabel}>Task details</ThemedText>
                <ThemedText style={styles.descriptionText}>
                  {assignment?.description?.trim() || 'No extra assignment details were added by the teacher.'}
                </ThemedText>
              </View>

              <View style={styles.detailCard}>
                <ThemedText style={styles.sectionLabel}>Assignment info</ThemedText>
                <View style={styles.infoList}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="menu-book" size={18} color="#113B63" />
                    <View style={styles.infoTextWrap}>
                      <ThemedText style={styles.infoTitle}>Subject</ThemedText>
                      <ThemedText style={styles.infoText}>
                        {subject?.subjectName || assignment?.subjectName || 'Subject not available'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="person" size={18} color="#113B63" />
                    <View style={styles.infoTextWrap}>
                      <ThemedText style={styles.infoTitle}>Teacher</ThemedText>
                      <ThemedText style={styles.infoText}>
                        {subject?.facultyName || assignment?.createdByFacultyName || assignment?.facultyName || 'Faculty not available'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="groups" size={18} color="#113B63" />
                    <View style={styles.infoTextWrap}>
                      <ThemedText style={styles.infoTitle}>Assigned to</ThemedText>
                      <ThemedText style={styles.infoText}>{highlightStats.audienceLabel}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="update" size={18} color="#113B63" />
                    <View style={styles.infoTextWrap}>
                      <ThemedText style={styles.infoTitle}>Last update</ThemedText>
                      <ThemedText style={styles.infoText}>{formatDate(assignment?.updatedAt, true)}</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
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
    gap: 18,
    paddingBottom: 156,
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: '#113B63',
    borderRadius: 28,
    marginTop: 12,
    padding: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  topButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  topButtonText: {
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 24,
    height: 62,
    justifyContent: 'center',
    marginBottom: 18,
    width: 62,
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
    maxWidth: 330,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  stateTitle: {
    color: '#132238',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: '#60758A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#113B63',
    borderRadius: 16,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#F8FBFF',
    fontSize: 14,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  panelLabel: {
    color: '#113B63',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  panelTitle: {
    color: '#132238',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  panelMeta: {
    color: '#60758A',
    fontSize: 14,
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  metricValue: {
    color: '#132238',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  metricLabel: {
    color: '#113B63',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  sectionLabel: {
    color: '#113B63',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  descriptionText: {
    color: '#4B6075',
    fontSize: 15,
    lineHeight: 22,
  },
  infoList: {
    gap: 14,
  },
  infoRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    color: '#132238',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoText: {
    color: '#60758A',
    fontSize: 14,
    lineHeight: 20,
  },
});
