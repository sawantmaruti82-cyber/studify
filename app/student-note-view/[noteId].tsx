import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNav } from '@/components/student-bottom-nav';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';

type SubjectMeta = {
  facultyName?: string;
  semester?: number | string;
  subjectCode?: string;
  subjectId?: string;
  subjectName?: string;
};

type AttachmentItem = {
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
};

type NoteItem = {
  _id?: string;
  attachments?: AttachmentItem[];
  description?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  subjectId?: string;
  subjectName?: string;
  title?: string;
  uploadedAt?: string;
};

const HtmlFrame = 'iframe' as any;

function formatUploadedAt(value?: string) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileSize(size?: number) {
  if (!size) {
    return 'Size unavailable';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}

function getFileIcon(fileType?: string) {
  const normalizedType = fileType?.toLowerCase() || '';

  if (normalizedType.includes('pdf')) {
    return 'picture-as-pdf';
  }

  if (normalizedType.includes('doc') || normalizedType.includes('presentation') || normalizedType.includes('excel')) {
    return 'description';
  }

  if (normalizedType.includes('image') || normalizedType.includes('jpg') || normalizedType.includes('png')) {
    return 'image';
  }

  return 'attach-file';
}

function getAbsoluteFileUrl(fileUrl?: string) {
  if (!fileUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  const apiBase = API_URL.replace(/\/api$/, '');
  return `${apiBase}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}

function getNoteAttachments(note?: NoteItem | null) {
  const attachments = Array.isArray(note?.attachments) ? note.attachments : [];

  if (attachments.length) {
    return attachments;
  }

  if (note?.fileUrl || note?.fileName || note?.fileType || note?.fileSize) {
    return [
      {
        fileId: note.fileId,
        fileName: note.fileName || note.title,
        fileSize: note.fileSize,
        fileType: note.fileType,
        fileUrl: note.fileUrl,
      },
    ];
  }

  return [];
}

function getPreviewKind(fileType?: string) {
  const normalizedType = fileType?.toLowerCase() || '';

  if (normalizedType.includes('image') || normalizedType.includes('jpg') || normalizedType.includes('jpeg') || normalizedType.includes('png')) {
    return 'image';
  }

  if (normalizedType.includes('pdf')) {
    return 'pdf';
  }

  return 'unsupported';
}

function isOfficeType(fileType?: string, fileName?: string) {
  const normalizedType = fileType?.toLowerCase() || '';
  const normalizedName = fileName?.toLowerCase() || '';

  return (
    normalizedType.includes('word') ||
    normalizedType.includes('presentation') ||
    normalizedType.includes('powerpoint') ||
    normalizedType.includes('excel') ||
    normalizedType.includes('spreadsheet') ||
    normalizedName.endsWith('.doc') ||
    normalizedName.endsWith('.docx') ||
    normalizedName.endsWith('.ppt') ||
    normalizedName.endsWith('.pptx') ||
    normalizedName.endsWith('.xls') ||
    normalizedName.endsWith('.xlsx')
  );
}

function isPublicPreviewUrl(url?: string | null) {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return false;
    }

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function getOfficePreviewUrl(fileUrl?: string | null) {
  if (!fileUrl || !isPublicPreviewUrl(fileUrl)) {
    return null;
  }

  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

export default function StudentNoteViewScreen() {
  const params = useLocalSearchParams<{ noteId?: string | string[] }>();
  const noteId = Array.isArray(params.noteId) ? params.noteId[0] : params.noteId;

  const [note, setNote] = useState<NoteItem | null>(null);
  const [subject, setSubject] = useState<SubjectMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0);

  useEffect(() => {
    const loadNote = async () => {
      if (!noteId) {
        setErrorMessage('This note could not be identified.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch(`${API_URL}/notes/item/${noteId}`);
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to load this note right now.');
        }

        setNote((data.note as NoteItem) || null);
        setSubject((data.subject as SubjectMeta) || null);
        setSelectedAttachmentIndex(0);
      } catch (error) {
        setNote(null);
        setSubject(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load this note right now.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadNote();
  }, [noteId, reloadKey]);

  const attachments = getNoteAttachments(note);
  const selectedAttachment = attachments[selectedAttachmentIndex] || attachments[0] || null;
  const selectedAttachmentUrl = getAbsoluteFileUrl(selectedAttachment?.fileUrl);
  const previewKind = getPreviewKind(selectedAttachment?.fileType);
  const officePreviewUrl =
    isOfficeType(selectedAttachment?.fileType, selectedAttachment?.fileName)
      ? getOfficePreviewUrl(selectedAttachmentUrl)
      : null;

  const handleOpenExternally = async () => {
    if (!selectedAttachmentUrl) {
      Alert.alert('File unavailable', 'This attachment does not have an openable URL yet.');
      return;
    }

    try {
      await Linking.openURL(selectedAttachmentUrl);
    } catch (error) {
      Alert.alert(
        'Could not open file',
        error instanceof Error ? error.message : 'This attachment could not be opened right now.'
      );
    }
  };

  const handleOpenPdfInBrowser = async () => {
    if (!selectedAttachmentUrl) {
      Alert.alert('File unavailable', 'This PDF does not have an openable URL yet.');
      return;
    }

    try {
      await openBrowserAsync(selectedAttachmentUrl, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    } catch (error) {
      Alert.alert(
        'Could not open PDF',
        error instanceof Error ? error.message : 'This PDF could not be opened right now.'
      );
    }
  };

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
              <MaterialIcons name={getFileIcon(selectedAttachment?.fileType)} size={30} color="#F8FBFF" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              {note?.title || 'Uploaded note'}
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {subject?.subjectName || note?.subjectName || 'Subject'} | {subject?.facultyName || 'Faculty'}
            </ThemedText>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="small" color="#113B63" />
              <ThemedText style={styles.stateTitle}>Loading note</ThemedText>
              <ThemedText style={styles.stateText}>Fetching the uploaded note details from Atlas.</ThemedText>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateCard}>
              <MaterialIcons name="wifi-off" size={26} color="#9A3D3D" />
              <ThemedText style={styles.stateTitle}>Could not load note</ThemedText>
              <ThemedText style={styles.stateText}>{errorMessage}</ThemedText>
              <Pressable onPress={() => setReloadKey((current) => current + 1)} style={styles.retryButton}>
                <ThemedText style={styles.retryButtonText}>Try again</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.panel}>
                <ThemedText style={styles.panelLabel}>Uploaded note</ThemedText>
                <ThemedText style={styles.panelTitle}>{subject?.subjectName || note?.subjectName || 'Subject'}</ThemedText>
                <ThemedText style={styles.panelMeta}>
                  {(subject?.subjectCode || note?.subjectId || 'Subject code') +
                    ` | ${formatUploadedAt(note?.uploadedAt)}`}
                </ThemedText>

                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricValue}>{attachments.length}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Attachments</ThemedText>
                  </View>
                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricValue}>Sem {subject?.semester || 5}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Current batch</ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <ThemedText style={styles.sectionLabel}>Description</ThemedText>
                <ThemedText style={styles.descriptionText}>
                  {note?.description?.trim() || 'No description was added for this note.'}
                </ThemedText>
              </View>

              <View style={styles.detailCard}>
                <ThemedText style={styles.sectionLabel}>Files</ThemedText>
                {attachments.length ? (
                  <View style={styles.attachmentsList}>
                    {attachments.map((attachment, index) => {
                      const isActive = index === selectedAttachmentIndex;

                      return (
                        <Pressable
                          key={`${attachment.fileId || attachment.fileName || index}`}
                          onPress={() => setSelectedAttachmentIndex(index)}
                          style={[styles.attachmentCard, isActive && styles.attachmentCardActive]}>
                          <View style={[styles.attachmentIconWrap, isActive && styles.attachmentIconWrapActive]}>
                            <MaterialIcons
                              name={getFileIcon(attachment.fileType)}
                              size={20}
                              color={isActive ? '#F8FBFF' : '#113B63'}
                            />
                          </View>
                          <View style={styles.attachmentBody}>
                            <ThemedText style={[styles.attachmentTitle, isActive && styles.attachmentTitleActive]}>
                              {attachment.fileName || `Attachment ${index + 1}`}
                            </ThemedText>
                            <ThemedText style={[styles.attachmentMeta, isActive && styles.attachmentMetaActive]}>
                              {attachment.fileType || 'Unknown type'} | {formatFileSize(attachment.fileSize)}
                            </ThemedText>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.stateCardCompact}>
                    <ThemedText style={styles.stateText}>No file was attached to this note.</ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.detailCard}>
                <ThemedText style={styles.sectionLabel}>Preview</ThemedText>
                {!selectedAttachment ? (
                  <View style={styles.previewFallback}>
                    <ThemedText style={styles.previewFallbackText}>Select a file to preview it here.</ThemedText>
                  </View>
                ) : previewKind === 'image' && selectedAttachmentUrl ? (
                  <Image resizeMode="contain" source={{ uri: selectedAttachmentUrl }} style={styles.imagePreview} />
                ) : previewKind === 'pdf' && selectedAttachmentUrl && Platform.OS === 'web' ? (
                  <View style={styles.frameWrap}>
                    <HtmlFrame
                      src={selectedAttachmentUrl}
                      style={styles.frame}
                      title={selectedAttachment.fileName || 'PDF preview'}
                    />
                  </View>
                ) : previewKind === 'pdf' && selectedAttachmentUrl ? (
                  <View style={styles.previewFallback}>
                    <MaterialIcons name="picture-as-pdf" size={24} color="#113B63" />
                    <ThemedText style={styles.previewFallbackTitle}>Open PDF in-app</ThemedText>
                    <ThemedText style={styles.previewFallbackText}>
                      On mobile, Studify will open this PDF in an in-app browser for reliable viewing.
                    </ThemedText>
                    <Pressable onPress={() => void handleOpenPdfInBrowser()} style={styles.openButton}>
                      <MaterialIcons name="open-in-new" size={18} color="#F8FBFF" />
                      <ThemedText style={styles.openButtonText}>Open PDF</ThemedText>
                    </Pressable>
                  </View>
                ) : officePreviewUrl && Platform.OS === 'web' ? (
                  <View style={styles.frameWrap}>
                    <HtmlFrame
                      src={officePreviewUrl}
                      style={styles.frame}
                      title={selectedAttachment?.fileName || 'Office preview'}
                    />
                  </View>
                ) : (
                  <View style={styles.previewFallback}>
                    <MaterialIcons name="info-outline" size={24} color="#113B63" />
                    <ThemedText style={styles.previewFallbackTitle}>Preview is limited here</ThemedText>
                    <ThemedText style={styles.previewFallbackText}>
                      Images and some PDFs can be shown directly. Other files can still be opened in an external app.
                    </ThemedText>
                    <Pressable onPress={() => void handleOpenExternally()} style={styles.openButton}>
                      <MaterialIcons name="open-in-new" size={18} color="#F8FBFF" />
                      <ThemedText style={styles.openButtonText}>Open file</ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            </>
          )}
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
  stateCardCompact: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
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
  attachmentsList: {
    gap: 10,
  },
  attachmentCard: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  attachmentCardActive: {
    backgroundColor: '#113B63',
    borderColor: '#113B63',
  },
  attachmentIconWrap: {
    alignItems: 'center',
    backgroundColor: '#E0ECFF',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  attachmentIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  attachmentBody: {
    flex: 1,
  },
  attachmentTitle: {
    color: '#132238',
    fontSize: 14,
    fontWeight: '700',
  },
  attachmentTitleActive: {
    color: '#F8FBFF',
  },
  attachmentMeta: {
    color: '#60758A',
    fontSize: 12,
    marginTop: 4,
  },
  attachmentMetaActive: {
    color: 'rgba(248,251,255,0.82)',
  },
  imagePreview: {
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    height: 640,
    width: '100%',
  },
  frameWrap: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 920,
    overflow: 'hidden',
  },
  frame: {
    borderWidth: 0,
    height: 920,
    width: '100%',
  },
  previewFallback: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 26,
  },
  previewFallbackTitle: {
    color: '#132238',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewFallbackText: {
    color: '#60758A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: '#113B63',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  openButtonText: {
    color: '#F8FBFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
