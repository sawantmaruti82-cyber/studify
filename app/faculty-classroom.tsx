import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FacultyBottomNav } from '@/components/faculty-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { getSession } from '@/constants/session';

type SubjectMeta = {
  facultyName?: string;
  semester?: number | string;
  subjectCode?: string;
  subjectId?: string;
  subjectName?: string;
};

export default function FacultyClassroomScreen() {
  const [facultySubject, setFacultySubject] = useState<SubjectMeta | null>(null);
  const [isSubjectLoading, setIsSubjectLoading] = useState(true);
  const [assignmentCount, setAssignmentCount] = useState(0);

  const showUiMessage = (title: string, description: string) => {
    Alert.alert(title, description);
  };

  useEffect(() => {
    const loadFacultySubject = async () => {
      setIsSubjectLoading(true);

      try {
        const session = await getSession();
        const teacherName = session?.user?.fullName?.trim().toLowerCase();

        if (!teacherName) {
          setFacultySubject(null);
          return;
        }

        const response = await fetch(`${API_URL}/subjects`);
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to load faculty subject.');
        }

        const subjects = Array.isArray(data.subjects) ? (data.subjects as SubjectMeta[]) : [];
        const matchedSubject =
          subjects.find((subject) => subject.facultyName?.trim().toLowerCase() === teacherName) || null;

        setFacultySubject(matchedSubject);

        if (matchedSubject?.subjectId) {
          const classroomResponse = await fetch(`${API_URL}/classroom/${matchedSubject.subjectId}`);
          const classroomData = await classroomResponse.json().catch(() => null);

          if (classroomResponse.ok && classroomData?.success) {
            setAssignmentCount(Array.isArray(classroomData.assignments) ? classroomData.assignments.length : 0);
          } else {
            setAssignmentCount(0);
          }
        } else {
          setAssignmentCount(0);
        }
      } catch {
        setFacultySubject(null);
        setAssignmentCount(0);
      } finally {
        setIsSubjectLoading(false);
      }
    };

    void loadFacultySubject();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroOrbLarge} />
            <View style={styles.heroOrbSmall} />
            <View style={styles.heroGrid} />

            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <MaterialIcons name="assignment" size={16} color="#F8FBFF" />
                <ThemedText style={styles.badgeText}>Classroom</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/faculty-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            {isSubjectLoading ? (
              <View style={styles.subjectLoadingCard}>
                <ActivityIndicator size="small" color="#F8FBFF" />
                <ThemedText style={styles.subjectLoadingLabel}>Loading your classroom...</ThemedText>
              </View>
            ) : facultySubject ? (
              <>
                <ThemedText type="title" style={styles.heroTitle}>
                  {facultySubject.subjectName}
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  Semester {facultySubject.semester || '5'} | {facultySubject.subjectCode || facultySubject.subjectId || 'Subject code'}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="title" style={styles.heroTitle}>
                  Faculty classroom
                </ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                  Connect the logged-in faculty to a subject in the subjects collection to show the real class.
                </ThemedText>
              </>
            )}

            <View style={styles.heroBottomRow}>
              <View style={styles.heroInfoCard}>
                <ThemedText style={styles.heroInfoLabel}>Section</ThemedText>
                <ThemedText style={styles.heroInfoValue}>Computer Science</ThemedText>
              </View>
              <View style={styles.heroInfoCard}>
                <ThemedText style={styles.heroInfoLabel}>Total assignments</ThemedText>
                <ThemedText style={styles.heroInfoValue}>
                  {isSubjectLoading ? '...' : `${assignmentCount}`}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Assignment workspace
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>
                  Keep this classroom focused on creating and managing assignments for your subject.
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() =>
                showUiMessage(
                  'Create assignment',
                  'This classroom is now focused on assignment creation. We can add the full assignment form next.'
                )
              }
              style={styles.assignmentHeroCard}>
              <View style={styles.assignmentHeroIconWrap}>
                <MaterialIcons name="assignment-add" size={26} color="#F7FBF9" />
              </View>
              <View style={styles.assignmentHeroBody}>
                <ThemedText style={styles.assignmentHeroTitle}>Create assignment</ThemedText>
                <ThemedText style={styles.assignmentHeroText}>
                  Post new work for your class with title, description, deadline, and attached files.
                </ThemedText>
              </View>
              <MaterialIcons name="arrow-forward" size={22} color="#F7FBF9" />
            </Pressable>

            <View style={styles.assignmentChecklist}>
              <View style={styles.checklistRow}>
                <View style={styles.checklistIconWrap}>
                  <MaterialIcons name="title" size={18} color="#0E5A43" />
                </View>
                <View style={styles.checklistBody}>
                  <ThemedText style={styles.checklistTitle}>Assignment title</ThemedText>
                  <ThemedText style={styles.checklistText}>
                    Give each task a clear and student-friendly title.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.checklistRow}>
                <View style={styles.checklistIconWrap}>
                  <MaterialIcons name="description" size={18} color="#0E5A43" />
                </View>
                <View style={styles.checklistBody}>
                  <ThemedText style={styles.checklistTitle}>Task details</ThemedText>
                  <ThemedText style={styles.checklistText}>
                    Add instructions, submission rules, and what students need to complete.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.checklistRow}>
                <View style={styles.checklistIconWrap}>
                  <MaterialIcons name="event" size={18} color="#0E5A43" />
                </View>
                <View style={styles.checklistBody}>
                  <ThemedText style={styles.checklistTitle}>Due date</ThemedText>
                  <ThemedText style={styles.checklistText}>
                    Set a clear deadline so it appears properly for students later.
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <FacultyBottomNav activeRoute="/faculty-classroom" />
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
    borderRadius: 30,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroOrbLarge: {
    backgroundColor: '#2E8F6B',
    borderRadius: 999,
    height: 240,
    position: 'absolute',
    right: -70,
    top: -50,
    width: 240,
  },
  heroOrbSmall: {
    backgroundColor: '#9DE2C5',
    borderRadius: 999,
    height: 126,
    left: -26,
    position: 'absolute',
    top: 136,
    width: 126,
  },
  heroGrid: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    height: 180,
    position: 'absolute',
    right: -20,
    top: 90,
    transform: [{ rotate: '-12deg' }],
    width: 180,
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
  subjectLoadingCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  subjectLoadingLabel: {
    color: '#F8FBFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#F8FBFF',
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(248,251,255,0.84)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    maxWidth: 320,
  },
  heroBottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    flex: 1,
    padding: 14,
  },
  heroInfoLabel: {
    color: 'rgba(248,251,255,0.68)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroInfoValue: {
    color: '#F8FBFF',
    fontSize: 15,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  panelHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  panelTitle: {
    color: '#17332A',
  },
  panelSubtitle: {
    color: '#5A756B',
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 280,
  },
  readyChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#D7F0E5',
    borderColor: '#0E5A43',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readyChipText: {
    color: '#0E5A43',
    fontSize: 12,
    fontWeight: '800',
  },
  assignmentHeroCard: {
    alignItems: 'center',
    backgroundColor: '#0E8B5F',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    marginBottom: 16,
  },
  assignmentHeroIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  assignmentHeroBody: {
    flex: 1,
  },
  assignmentHeroTitle: {
    color: '#F7FBF9',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  assignmentHeroText: {
    color: 'rgba(247,251,249,0.86)',
    fontSize: 14,
    lineHeight: 20,
  },
  assignmentChecklist: {
    gap: 12,
  },
  checklistRow: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  checklistIconWrap: {
    alignItems: 'center',
    backgroundColor: '#D7F0E5',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  checklistBody: {
    flex: 1,
  },
  checklistTitle: {
    color: '#17332A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  checklistText: {
    color: '#5A756B',
    fontSize: 14,
    lineHeight: 20,
  },
});
