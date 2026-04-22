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

type NoteSubject = {
  department?: string;
  facultyId?: string;
  facultyName?: string;
  semester?: number;
  subjectCode?: string;
  subjectId?: string;
  subjectName: string;
};

type NoteItem = {
  _id?: string;
  attachments?: {
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileUrl?: string;
  }[];
  description?: string;
  facultyName?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  title: string;
  uploadedAt?: string;
};

function formatDate(value?: string) {
  if (!value) {
    return 'Recently uploaded';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Recently uploaded';
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentSubjectNotesScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();
  const [subject, setSubject] = useState<NoteSubject | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const stats = useMemo(() => {
    const withFiles = notes.filter((note) => Boolean(note.fileUrl)).length;
    return {
      totalNotes: notes.length,
      uploadedFiles: withFiles,
    };
  }, [notes]);

  const loadNotes = useCallback(async (refreshing = false) => {
    if (!subjectId) {
      setErrorMessage('This notes page is missing a subject id.');
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
      const response = await fetch(`${API_URL}/notes/${subjectId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to load these subject notes.');
      }

      setSubject(data.subject ?? null);
      setNotes(Array.isArray(data.notes) ? data.notes : []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.name === 'AbortError'
          ? 'Notes request timed out. Restart the backend and try again.'
          : error instanceof Error
            ? error.message
            : 'Could not load these notes right now.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [subjectId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const openNote = (note: NoteItem) => {
    if (!note._id) {
      Alert.alert('Note unavailable', 'This note is missing its id, so it cannot open yet.');
      return;
    }

    router.push({
      pathname: '/student-note-view/[noteId]',
      params: {
        noteId: note._id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadNotes(true)} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={18} color="#F8FBFF" />
                <ThemedText style={styles.backButtonText}>Notes</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="menu-book" size={34} color="#F8FBFF" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              {subject?.subjectName || 'Subject notes'}
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {subject?.facultyName || 'Faculty not assigned'} | {subject?.subjectCode || subject?.subjectId || 'Subject'}
            </ThemedText>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>{stats.totalNotes}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Total notes</ThemedText>
              </View>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>{stats.uploadedFiles}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>With files</ThemedText>
              </View>
              <View style={styles.heroStatCard}>
                <ThemedText style={styles.heroStatValue}>Sem {subject?.semester || 5}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Current batch</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Pressable onPress={() => void loadNotes(true)} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={18} color="#113B63" />
              </Pressable>
              <ThemedText type="subtitle" style={styles.panelTitle}>
                Uploaded notes
              </ThemedText>
              <ThemedText style={styles.panelSubtitle}>
                Notes uploaded by the respective subject teacher.
              </ThemedText>
            </View>

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color="#113B63" />
                <ThemedText style={styles.stateTitle}>Loading notes</ThemedText>
                <ThemedText style={styles.stateDescription}>Fetching uploaded notes from Atlas.</ThemedText>
              </View>
            ) : errorMessage ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrapError}>
                  <MaterialIcons name="wifi-off" size={28} color="#9A3D3D" />
                </View>
                <ThemedText style={styles.stateTitle}>Could not load notes</ThemedText>
                <ThemedText style={styles.stateDescription}>{errorMessage}</ThemedText>
                <Pressable onPress={() => void loadNotes()} style={styles.retryButton}>
                  <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
                </Pressable>
              </View>
            ) : notes.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIconWrap}>
                  <MaterialIcons name="description" size={28} color="#113B63" />
                </View>
                <ThemedText style={styles.stateTitle}>No notes uploaded yet</ThemedText>
                <ThemedText style={styles.stateDescription}>
                  When the subject teacher uploads notes to the new notes collection, they will appear here.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.notesList}>
                {notes.map((note) => (
                  <Pressable
                    key={note._id || `${note.title}-${note.uploadedAt}`}
                    onPress={() => openNote(note)}
                    style={styles.noteCard}>
                    <View style={styles.noteTopRow}>
                      <View style={styles.noteIconWrap}>
                        <MaterialIcons name="description" size={20} color="#113B63" />
                      </View>
                      <View style={styles.noteTitleWrap}>
                        <ThemedText style={styles.noteTitle}>{note.title}</ThemedText>
                        <ThemedText style={styles.noteMeta}>
                          Uploaded by {note.facultyName || subject?.facultyName || 'Faculty'}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText style={styles.noteDescription}>
                      {note.description || 'No note description was added yet.'}
                    </ThemedText>

                    <View style={styles.noteFooter}>
                      <View style={styles.noteFooterRow}>
                        <MaterialIcons name="event" size={16} color="#60758A" />
                        <ThemedText style={styles.noteFooterText}>{formatDate(note.uploadedAt)}</ThemedText>
                      </View>
                      <View style={styles.noteFooterRow}>
                        <MaterialIcons name="attach-file" size={16} color="#60758A" />
                        <ThemedText style={styles.noteFooterText}>
                          {Array.isArray(note.attachments) && note.attachments.length
                            ? `${note.attachments.length} file${note.attachments.length === 1 ? '' : 's'}`
                            : note.fileType || 'No file yet'}
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                ))}
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
  notesList: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  noteTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  noteIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(17,59,99,0.08)',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  noteTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  noteTitle: {
    color: '#132238',
    fontSize: 16,
    fontWeight: '800',
  },
  noteMeta: {
    color: '#60758A',
    fontSize: 12,
    marginTop: 4,
  },
  noteDescription: {
    color: '#4B6075',
    fontSize: 14,
    lineHeight: 21,
  },
  noteFooter: {
    gap: 10,
    marginTop: 14,
  },
  noteFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  noteFooterText: {
    color: '#60758A',
    fontSize: 13,
  },
});
