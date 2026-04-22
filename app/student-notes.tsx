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

import { StudentBottomNav } from '@/components/student-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';

type NoteSubject = {
  _id?: string;
  department?: string;
  facultyId?: string;
  facultyName?: string;
  noteCount?: number;
  semester?: number;
  subjectCode?: string;
  subjectId?: string;
  subjectName: string;
};

const noteThemes = [
  { accent: '#27548A', soft: '#E0ECFF' },
  { accent: '#7A4DA8', soft: '#F0E3FF' },
  { accent: '#0F6F66', soft: '#DCF8F1' },
  { accent: '#A85E28', soft: '#FFEBDD' },
  { accent: '#A43D72', soft: '#FFE2F0' },
  { accent: '#3E649E', soft: '#E2ECFF' },
] as const;

export default function StudentNotesScreen() {
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const stats = useMemo(() => {
    const totalNotes = subjects.reduce((sum, subject) => sum + (subject.noteCount || 0), 0);

    return {
      subjectCount: subjects.length,
      totalNotes,
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
      const response = await fetch(`${API_URL}/notes/subjects`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to load notes subjects.');
      }

      setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.name === 'AbortError'
          ? 'Notes request timed out. Restart the backend and try again.'
          : error instanceof Error
            ? error.message
            : 'Could not load the notes right now.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadSubjects();
  }, []);

  const openNotesSubject = (subject: NoteSubject) => {
    if (!subject.subjectId) {
      return;
    }

    router.push({
      pathname: '/student-notes/[subjectId]',
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
                <MaterialIcons name="menu-book" size={16} color="#F8FBFF" />
                <ThemedText style={styles.badgeText}>Notes</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="menu-book" size={34} color="#F8FBFF" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Subject notes
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Teacher-uploaded notes stay separate from classroom work and open subject by subject.
            </ThemedText>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>{stats.subjectCount}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Subjects</ThemedText>
              </View>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>{stats.totalNotes}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Uploaded notes</ThemedText>
              </View>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>Sem 5</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Current batch</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Pressable onPress={() => void loadSubjects(true)} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={18} color="#113B63" />
              </Pressable>
              <ThemedText type="subtitle" style={styles.panelTitle}>
                Notes library
              </ThemedText>
              <ThemedText style={styles.panelSubtitle}>
                Open notes uploaded by each subject teacher.
              </ThemedText>
            </View>

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color="#113B63" />
                <ThemedText style={styles.stateTitle}>Loading notes</ThemedText>
                <ThemedText style={styles.stateDescription}>Fetching subject note spaces from Atlas.</ThemedText>
              </View>
            ) : errorMessage ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrapError}>
                  <MaterialIcons name="wifi-off" size={28} color="#9A3D3D" />
                </View>
                <ThemedText style={styles.stateTitle}>Could not load notes</ThemedText>
                <ThemedText style={styles.stateDescription}>{errorMessage}</ThemedText>
                <Pressable onPress={() => void loadSubjects()} style={styles.retryButton}>
                  <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.notesGrid}>
                {subjects.map((subject, index) => {
                  const theme = noteThemes[index % noteThemes.length];

                  return (
                    <Pressable
                      key={subject._id || subject.subjectId || `${subject.subjectCode}-${index}`}
                      onPress={() => openNotesSubject(subject)}
                      style={styles.noteCard}>
                      <View style={[styles.noteBanner, { backgroundColor: theme.accent }]}>
                        <View style={styles.noteBannerTopRow}>
                          <View style={styles.subjectCodeChip}>
                            <ThemedText style={styles.subjectCodeText}>
                              {subject.subjectCode || subject.subjectId || 'CS'}
                            </ThemedText>
                          </View>
                          <View style={styles.noteCountChip}>
                            <ThemedText style={styles.noteCountText}>{subject.noteCount || 0} notes</ThemedText>
                          </View>
                        </View>

                        <ThemedText style={styles.noteTitle}>{subject.subjectName}</ThemedText>
                        <ThemedText style={styles.noteSubtitle}>{subject.facultyName || 'Faculty TBA'}</ThemedText>
                      </View>

                      <View style={styles.noteBody}>
                        <View style={styles.noteMetaRow}>
                          <MaterialIcons name="school" size={16} color="#60758A" />
                          <ThemedText style={styles.noteMetaText}>{subject.department || 'CS'} department</ThemedText>
                          <MaterialIcons name="arrow-forward" size={16} color="#60758A" />
                        </View>
                        <View style={styles.noteMetaRowSecondary}>
                          <MaterialIcons name="menu-book" size={16} color="#60758A" />
                          <ThemedText style={styles.noteMetaText}>Subject notes</ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        <StudentBottomNav activeRoute="/student-notes" />
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
  notesGrid: {
    gap: 14,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  noteBanner: {
    minHeight: 122,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  noteBannerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subjectCodeChip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subjectCodeText: {
    color: '#F8FBFF',
    fontSize: 12,
    fontWeight: '800',
  },
  noteCountChip: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noteCountText: {
    color: '#F8FBFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noteTitle: {
    color: '#F8FBFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  noteSubtitle: {
    color: 'rgba(248,251,255,0.78)',
    fontSize: 13,
    marginTop: 8,
  },
  noteBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  noteMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 6,
  },
  noteMetaText: {
    color: '#60758A',
    fontSize: 13,
    flex: 1,
  },
  noteMetaRowSecondary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
});
