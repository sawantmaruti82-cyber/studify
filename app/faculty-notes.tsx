import * as DocumentPicker from 'expo-document-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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

type AttachmentItem = {
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
};

type NoteItem = {
  attachments?: AttachmentItem[];
  _id?: string;
  description?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  title: string;
  uploadedAt?: string;
};

type SelectedUpload = {
  file?: File;
  fileId?: string;
  mimeType?: string;
  name: string;
  size?: number;
  uri: string;
  url?: string;
};

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

function getFileIcon(fileType?: string) {
  const normalizedType = fileType?.toLowerCase() || '';

  if (normalizedType.includes('pdf')) {
    return 'picture-as-pdf';
  }

  if (normalizedType.includes('doc')) {
    return 'description';
  }

  if (normalizedType.includes('image') || normalizedType.includes('jpg') || normalizedType.includes('png')) {
    return 'image';
  }

  return 'attach-file';
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

function getNoteAttachments(note?: NoteItem | null) {
  const attachments = Array.isArray(note?.attachments) ? note.attachments : [];

  if (attachments.length) {
    return attachments;
  }

  if (note?.fileUrl || note?.fileName || note?.fileType || note?.fileSize) {
    return [
      {
        fileId: note.fileId,
        mimeType: note.fileType,
        name: note.fileName || note.title,
        size: note.fileSize,
        uri: note.fileUrl || '',
        url: note.fileUrl,
      },
    ];
  }

  return [];
}

function getPrimaryAttachment(note?: NoteItem | null) {
  return getNoteAttachments(note)[0] || null;
}

export default function FacultyNotesScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [facultySubject, setFacultySubject] = useState<SubjectMeta | null>(null);
  const [isSubjectLoading, setIsSubjectLoading] = useState(true);
  const [uploadedNotes, setUploadedNotes] = useState<NoteItem[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<SelectedUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSelectedFiles, setEditSelectedFiles] = useState<SelectedUpload[]>([]);
  const [editRemovedAttachmentIds, setEditRemovedAttachmentIds] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [selectedNoteAction, setSelectedNoteAction] = useState<NoteItem | null>(null);
  const [deleteCandidateNote, setDeleteCandidateNote] = useState<NoteItem | null>(null);

  const showUiMessage = (titleText: string, message: string) => {
    Alert.alert(titleText, message);
  };

  const loadFacultySubject = async () => {
    setIsSubjectLoading(true);
    setIsNotesLoading(true);

    try {
      const session = await getSession();
      const teacherName = session?.user?.fullName?.trim().toLowerCase();

      if (!teacherName) {
        setFacultySubject(null);
        setUploadedNotes([]);
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
        const notesResponse = await fetch(`${API_URL}/notes/${matchedSubject.subjectId}`);
        const notesData = await notesResponse.json().catch(() => null);

        if (notesResponse.ok && notesData?.success) {
          setUploadedNotes(Array.isArray(notesData.notes) ? (notesData.notes as NoteItem[]) : []);
        } else {
          setUploadedNotes([]);
        }
      } else {
        setUploadedNotes([]);
      }
    } catch {
      setFacultySubject(null);
      setUploadedNotes([]);
    } finally {
      setIsSubjectLoading(false);
      setIsNotesLoading(false);
    }
  };

  useEffect(() => {
    void loadFacultySubject();
  }, []);

  const handleChooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: '*/*',
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setSelectedFiles(
        result.assets.map((asset) => ({
          file: asset.file ?? undefined,
          mimeType: asset.mimeType,
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
        }))
      );
    } catch (error) {
      showUiMessage(
        'Could not choose file',
        error instanceof Error ? error.message : 'The file picker could not open right now.'
      );
    }
  };

  const handleChooseEditFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: '*/*',
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setEditSelectedFiles((currentFiles) => [
        ...currentFiles,
        ...result.assets.map((asset) => ({
          file: asset.file ?? undefined,
          mimeType: asset.mimeType,
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
        })),
      ]);
    } catch (error) {
      showUiMessage(
        'Could not choose files',
        error instanceof Error ? error.message : 'The file picker could not open right now.'
      );
    }
  };

  const handleUploadNote = async () => {
    if (!facultySubject?.subjectId) {
      showUiMessage('Subject missing', 'Your subject is not linked yet, so this note cannot be uploaded.');
      return;
    }

    if (!title.trim()) {
      showUiMessage('Title required', 'Please enter a note title before uploading.');
      return;
    }

    if (!selectedFiles.length) {
      showUiMessage('Files required', 'Choose at least one file before saving the note.');
      return;
    }

    setIsUploading(true);

    try {
      const session = await getSession();
      const formData = new FormData();

      formData.append('subjectId', facultySubject.subjectId);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('facultyName', session?.user?.fullName || '');

      for (const selectedFile of selectedFiles) {
        if (Platform.OS === 'web' && selectedFile.file) {
          formData.append('files', selectedFile.file, selectedFile.name);
        } else {
          formData.append('files', {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.mimeType || 'application/octet-stream',
          } as never);
        }
      }

      const response = await fetch(`${API_URL}/notes/upload`, {
        body: formData,
        method: 'POST',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to upload the note right now.');
      }

      setTitle('');
      setDescription('');
      setSelectedFiles([]);
      await loadFacultySubject();
      showUiMessage('Note uploaded', 'Your note has been uploaded to Atlas for this subject.');
    } catch (error) {
      showUiMessage(
        'Upload failed',
        error instanceof Error ? error.message : 'The note could not be uploaded right now.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openNote = async (note: NoteItem) => {
    if (!note._id) {
      showUiMessage('Note unavailable', 'This note is not available to open right now.');
      return;
    }

    router.push(`/faculty-notes/${note._id}`);
  };

  const startEditNote = (note: NoteItem) => {
    setSelectedNoteAction(null);
    setEditingNote(note);
    setEditTitle(note.title || '');
    setEditDescription(note.description || '');
    setEditSelectedFiles([]);
    setEditRemovedAttachmentIds([]);
  };

  const getVisibleEditAttachments = () =>
    getNoteAttachments(editingNote).filter((attachment) => {
      if (!attachment.fileId) {
        return true;
      }

      return !editRemovedAttachmentIds.includes(attachment.fileId);
    });

  const handleSaveEdit = async () => {
    if (!editingNote?._id) {
      showUiMessage('Note missing', 'This note is not available for editing right now.');
      return;
    }

    if (!editTitle.trim()) {
      showUiMessage('Title required', 'Please enter a title before saving your changes.');
      return;
    }

    setIsSavingEdit(true);

    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('description', editDescription.trim());
      formData.append('removeAttachmentIds', JSON.stringify(editRemovedAttachmentIds));

      for (const selectedFile of editSelectedFiles) {
        if (Platform.OS === 'web' && selectedFile.file) {
          formData.append('files', selectedFile.file, selectedFile.name);
        } else {
          formData.append('files', {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.mimeType || 'application/octet-stream',
          } as never);
        }
      }

      const response = await fetch(`${API_URL}/notes/${editingNote._id}`, {
        body: formData,
        method: 'PATCH',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to update this note right now.');
      }

      setEditingNote(null);
      setEditTitle('');
      setEditDescription('');
      setEditSelectedFiles([]);
      setEditRemovedAttachmentIds([]);
      await loadFacultySubject();
      showUiMessage(
        'Note updated',
        editSelectedFiles.length
          ? 'Your note details and new files have been added.'
          : 'Your note details have been updated.'
      );
    } catch (error) {
      showUiMessage(
        'Update failed',
        error instanceof Error ? error.message : 'The note could not be updated right now.'
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteNote = async (note: NoteItem) => {
    if (!note._id) {
      showUiMessage('Note missing', 'This note is not available for deletion right now.');
      return;
    }

    setIsDeletingNote(true);

    try {
      const response = await fetch(`${API_URL}/notes/${note._id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to delete this note right now.');
      }

      if (editingNote?._id === note._id) {
        setEditingNote(null);
        setEditTitle('');
        setEditDescription('');
        setEditSelectedFiles([]);
        setEditRemovedAttachmentIds([]);
      }

      setDeleteCandidateNote(null);
      setSelectedNoteAction(null);
      await loadFacultySubject();
      showUiMessage('Note deleted', 'The uploaded note has been removed.');
    } catch (error) {
      showUiMessage(
        'Delete failed',
        error instanceof Error ? error.message : 'The note could not be deleted right now.'
      );
    } finally {
      setIsDeletingNote(false);
    }
  };

  const showNoteActions = (note: NoteItem) => {
    setSelectedNoteAction(note);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <MaterialIcons name="menu-book" size={16} color="#F7FBF9" />
                <ThemedText style={styles.badgeText}>Notes</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/faculty-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F7FBF9" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="upload-file" size={34} color="#F7FBF9" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Upload notes for your class.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Add a title, attach a file, and save it directly under your assigned subject in Atlas.
            </ThemedText>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Create note
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>
                  Prepare the note details and attached files for students.
                </ThemedText>
              </View>
              <View style={styles.readyChip}>
                <ThemedText style={styles.readyChipText}>Upload ready</ThemedText>
              </View>
            </View>

            <View style={styles.subjectCard}>
              <View style={styles.subjectCardHeader}>
                <View style={styles.subjectCardIconWrap}>
                  <MaterialIcons name="school" size={22} color="#F7FBF9" />
                </View>
                <View style={styles.subjectCardBody}>
                  <ThemedText style={styles.subjectCardLabel}>Assigned subject</ThemedText>
                  {isSubjectLoading ? (
                    <View style={styles.subjectLoadingRow}>
                      <ActivityIndicator size="small" color="#F7FBF9" />
                      <ThemedText style={styles.subjectLoadingText}>Loading your subject...</ThemedText>
                    </View>
                  ) : facultySubject ? (
                    <>
                      <ThemedText style={styles.subjectCardTitle}>{facultySubject.subjectName}</ThemedText>
                      <ThemedText style={styles.subjectCardMeta}>
                        {facultySubject.subjectCode || facultySubject.subjectId || 'Subject code'} | Semester {facultySubject.semester || '5'}
                      </ThemedText>
                      <ThemedText style={styles.subjectCardMetaSecondary}>
                        Notes in Atlas for this subject: {uploadedNotes.length}
                      </ThemedText>
                    </>
                  ) : (
                    <>
                      <ThemedText style={styles.subjectCardTitle}>Subject will appear here</ThemedText>
                      <ThemedText style={styles.subjectCardMeta}>
                        Connect the logged-in faculty to a subject in the subjects collection.
                      </ThemedText>
                    </>
                  )}
                </View>
              </View>

              {!isSubjectLoading && facultySubject ? (
                <View style={styles.subjectMetricsRow}>
                  <View style={styles.subjectMetricCard}>
                    <ThemedText style={styles.subjectMetricValue}>{uploadedNotes.length}</ThemedText>
                    <ThemedText style={styles.subjectMetricLabel}>Stored notes</ThemedText>
                    <ThemedText style={styles.subjectMetricDetail}>
                      Saved under this subject bucket in the notes collection.
                    </ThemedText>
                  </View>
                  <View style={styles.subjectMetricCard}>
                    <ThemedText style={styles.subjectMetricValue}>
                      {uploadedNotes[0]?.uploadedAt ? formatUploadedAt(uploadedNotes[0].uploadedAt) : '--'}
                    </ThemedText>
                    <ThemedText style={styles.subjectMetricLabel}>Latest upload</ThemedText>
                    <ThemedText style={styles.subjectMetricDetail}>
                      {uploadedNotes[0]?.title || 'No existing note uploaded yet'}
                    </ThemedText>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Note title</ThemedText>
              <View style={styles.inputShell}>
                <MaterialIcons name="title" size={20} color="#5A756B" />
                <TextInput
                  onChangeText={setTitle}
                  placeholder="Ex. Unit 4 Revision Notes"
                  placeholderTextColor="#7C948B"
                  style={styles.input}
                  value={title}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Short description</ThemedText>
              <View style={[styles.inputShell, styles.textareaShell]}>
                <TextInput
                  multiline
                  numberOfLines={4}
                  onChangeText={setDescription}
                  placeholder="Add a short note about what students will find in this upload."
                  placeholderTextColor="#7C948B"
                  style={styles.textarea}
                  textAlignVertical="top"
                  value={description}
                />
              </View>
            </View>

            <View style={styles.uploadCard}>
              <View style={styles.uploadHeader}>
                <View>
                  <ThemedText style={styles.uploadTitle}>Attach files</ThemedText>
                  <ThemedText style={styles.uploadSubtitle}>
                    PDFs, DOC files, images, or study sheets can be attached here and stored under this subject.
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => void handleChooseFile()}
                  style={styles.uploadButton}>
                  <MaterialIcons name="attach-file" size={18} color="#F7FBF9" />
                  <ThemedText style={styles.uploadButtonText}>Choose files</ThemedText>
                </Pressable>
              </View>

              <View style={styles.dropZone}>
                <MaterialIcons name="cloud-upload" size={28} color="#12634B" />
                <ThemedText style={styles.dropZoneTitle}>Tap to attach note files</ThemedText>
                <ThemedText style={styles.dropZoneText}>
                  Choose one or more PDFs, DOC files, images, or study sheets and save them under this subject.
                </ThemedText>
              </View>

              {selectedFiles.length ? (
                <View style={styles.selectedFilesList}>
                  {selectedFiles.map((selectedFile, index) => (
                    <View key={`${selectedFile.name}-${selectedFile.uri}-${index}`} style={styles.selectedFileCard}>
                      <View style={styles.fileIconWrap}>
                        <MaterialIcons name={getFileIcon(selectedFile.mimeType)} size={20} color="#12634B" />
                      </View>
                      <View style={styles.fileBody}>
                        <ThemedText style={styles.fileLabel}>{selectedFile.name}</ThemedText>
                        <ThemedText style={styles.fileMeta}>
                          {selectedFile.mimeType || 'Unknown type'} | {formatFileSize(selectedFile.size)}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() =>
                          setSelectedFiles((currentFiles) =>
                            currentFiles.filter((_, currentIndex) => currentIndex !== index)
                          )
                        }
                        style={styles.fileAction}>
                        <MaterialIcons name="close" size={20} color="#5A756B" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => {
                  setTitle('');
                  setDescription('');
                  setSelectedFiles([]);
                }}
                style={styles.secondaryButton}>
                <ThemedText style={styles.secondaryButtonText}>Clear</ThemedText>
              </Pressable>
              <Pressable
                disabled={isUploading}
                onPress={() => void handleUploadNote()}
                style={[styles.primaryButton, isUploading && styles.primaryButtonDisabled]}>
                <MaterialIcons name="publish" size={18} color="#F7FBF9" />
                <ThemedText style={styles.primaryButtonText}>
                  {isUploading ? 'Uploading...' : 'Save note'}
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <ThemedText style={styles.listSectionTitle}>Existing subject notes</ThemedText>
                <ThemedText style={styles.listSectionSubtitle}>
                  These notes are already stored in Atlas for your subject.
                </ThemedText>
              </View>
            </View>

            {isNotesLoading ? (
              <View style={styles.emptyStateCard}>
                <ActivityIndicator size="small" color="#12634B" />
                <ThemedText style={styles.emptyStateTitle}>Loading notes</ThemedText>
                <ThemedText style={styles.emptyStateText}>
                  Checking the notes collection for this subject.
                </ThemedText>
              </View>
            ) : uploadedNotes.length ? (
              <View style={styles.fileList}>
                {uploadedNotes.map((file) => (
                  <View key={file._id || file.title} style={styles.fileCard}>
                    <View style={styles.fileIconWrap}>
                      <MaterialIcons
                        name={getFileIcon(getPrimaryAttachment(file)?.fileType || file.fileType)}
                        size={20}
                        color="#12634B"
                      />
                    </View>
                    <View style={styles.fileBody}>
                      <ThemedText style={styles.fileLabel}>{file.title}</ThemedText>
                      <ThemedText style={styles.fileMeta}>
                        {getNoteAttachments(file).length} file{getNoteAttachments(file).length === 1 ? '' : 's'} | {formatUploadedAt(file.uploadedAt)}
                      </ThemedText>
                      {file.description ? (
                        <ThemedText style={styles.fileDescription}>{file.description}</ThemedText>
                      ) : null}
                    </View>
                    <Pressable onPress={() => showNoteActions(file)} style={styles.fileAction}>
                      <MaterialIcons name="more-horiz" size={20} color="#5A756B" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <MaterialIcons name="folder-open" size={26} color="#12634B" />
                <ThemedText style={styles.emptyStateTitle}>No stored notes yet</ThemedText>
                <ThemedText style={styles.emptyStateText}>
                  Once notes are saved for this subject in Atlas, they will appear here automatically.
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          onRequestClose={() => {
            if (!isSavingEdit && !isDeletingNote) {
              setEditingNote(null);
            }
          }}
          transparent
          visible={!!editingNote}>
          <View style={styles.modalBackdrop}>
            <Pressable
              onPress={() => {
                if (!isSavingEdit && !isDeletingNote) {
                  setEditingNote(null);
                }
              }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <ThemedText style={styles.modalEyebrow}>Edit note</ThemedText>
                  <ThemedText style={styles.modalTitle}>Update uploaded note</ThemedText>
                </View>
                <Pressable
                  disabled={isSavingEdit || isDeletingNote}
                  onPress={() => setEditingNote(null)}
                  style={styles.modalCloseButton}>
                  <MaterialIcons name="close" size={20} color="#17332A" />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}>
                <View style={styles.modalSection}>
                  <ThemedText style={styles.fieldLabel}>Note title</ThemedText>
                  <View style={styles.inputShell}>
                    <MaterialIcons name="title" size={20} color="#5A756B" />
                    <TextInput
                      onChangeText={setEditTitle}
                      placeholder="Ex. Unit 4 Revision Notes"
                      placeholderTextColor="#7C948B"
                      style={styles.input}
                      value={editTitle}
                    />
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <ThemedText style={styles.fieldLabel}>Short description</ThemedText>
                  <View style={[styles.inputShell, styles.textareaShell]}>
                    <TextInput
                      multiline
                      numberOfLines={4}
                      onChangeText={setEditDescription}
                      placeholder="Update what students should know about this file."
                      placeholderTextColor="#7C948B"
                      style={styles.textarea}
                      textAlignVertical="top"
                      value={editDescription}
                    />
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <ThemedText style={styles.fieldLabel}>Current attachments</ThemedText>
                  <View style={styles.modalAttachmentsList}>
                  {getVisibleEditAttachments().length ? (
                    getVisibleEditAttachments().map((attachment, index) => (
                      <View
                        key={`${attachment.fileId || attachment.fileName || index}`}
                        style={styles.modalAttachmentCard}>
                          <View style={styles.fileIconWrap}>
                            <MaterialIcons name={getFileIcon(attachment.fileType)} size={20} color="#12634B" />
                          </View>
                          <View style={styles.fileBody}>
                            <ThemedText style={styles.fileLabel}>
                              {attachment.fileName || `Attachment ${index + 1}`}
                            </ThemedText>
                          <ThemedText style={styles.fileMeta}>
                            {attachment.fileType || 'Unknown type'} | {formatFileSize(attachment.fileSize)}
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => {
                            if (!attachment.fileId) {
                              return;
                            }

                            setEditRemovedAttachmentIds((currentIds) =>
                              currentIds.includes(attachment.fileId!)
                                ? currentIds
                                : [...currentIds, attachment.fileId!]
                            );
                          }}
                          style={styles.modalAttachmentRemoveButton}>
                          <MaterialIcons name="delete-outline" size={18} color="#B42318" />
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <View style={styles.modalAttachmentEmpty}>
                      <ThemedText style={styles.modalAttachmentEmptyText}>
                        {editRemovedAttachmentIds.length
                          ? 'All current attachments will be removed when you save these changes.'
                          : 'No attachment is stored on this note yet.'}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>

                <View style={styles.modalSection}>
                  <View style={styles.editUploadHeader}>
                    <View style={styles.editUploadTitleWrap}>
                      <ThemedText style={styles.fieldLabel}>Add more files</ThemedText>
                      <ThemedText style={styles.editUploadSubtitle}>
                        New files will be added to this note without removing the existing attachments.
                      </ThemedText>
                    </View>
                    <Pressable onPress={() => void handleChooseEditFiles()} style={styles.editUploadButton}>
                      <MaterialIcons name="attach-file" size={18} color="#F7FBF9" />
                      <ThemedText style={styles.editUploadButtonText}>Add files</ThemedText>
                    </Pressable>
                  </View>

                  {editSelectedFiles.length ? (
                    <View style={styles.selectedFilesList}>
                      {editSelectedFiles.map((selectedFile, index) => (
                        <View key={`${selectedFile.name}-${selectedFile.uri}-${index}`} style={styles.selectedFileCard}>
                          <View style={styles.fileIconWrap}>
                            <MaterialIcons name={getFileIcon(selectedFile.mimeType)} size={20} color="#12634B" />
                          </View>
                          <View style={styles.fileBody}>
                            <ThemedText style={styles.fileLabel}>{selectedFile.name}</ThemedText>
                            <ThemedText style={styles.fileMeta}>
                              {selectedFile.mimeType || 'Unknown type'} | {formatFileSize(selectedFile.size)}
                            </ThemedText>
                          </View>
                          <Pressable
                            onPress={() =>
                              setEditSelectedFiles((currentFiles) =>
                                currentFiles.filter((_, currentIndex) => currentIndex !== index)
                              )
                            }
                            style={styles.fileAction}>
                            <MaterialIcons name="close" size={20} color="#5A756B" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.modalAttachmentEmpty}>
                      <ThemedText style={styles.modalAttachmentEmptyText}>
                        No new files selected yet.
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.modalInfoCard}>
                  <MaterialIcons
                    name={getFileIcon(getPrimaryAttachment(editingNote)?.fileType || editingNote?.fileType)}
                    size={20}
                    color="#12634B"
                  />
                  <View style={styles.modalInfoBody}>
                    <ThemedText style={styles.modalInfoTitle}>
                      {getPrimaryAttachment(editingNote)?.fileName || editingNote?.fileName || editingNote?.title || 'Uploaded file'}
                    </ThemedText>
                    <ThemedText style={styles.modalInfoText}>
                      {getPrimaryAttachment(editingNote)?.fileType || editingNote?.fileType || 'Unknown type'}
                      {(getPrimaryAttachment(editingNote)?.fileSize || editingNote?.fileSize)
                        ? ` | ${formatFileSize(getPrimaryAttachment(editingNote)?.fileSize || editingNote?.fileSize)}`
                        : ''}
                    </ThemedText>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <View style={styles.modalActionRow}>
                <Pressable
                  disabled={isSavingEdit || isDeletingNote}
                  onPress={() => setEditingNote(null)}
                  style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  disabled={isSavingEdit || isDeletingNote}
                  onPress={() => void handleSaveEdit()}
                  style={[styles.primaryButton, (isSavingEdit || isDeletingNote) && styles.primaryButtonDisabled]}>
                  <MaterialIcons name="save" size={18} color="#F7FBF9" />
                  <ThemedText style={styles.primaryButtonText}>
                    {isSavingEdit ? 'Saving...' : 'Save changes'}
                  </ThemedText>
                </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => setSelectedNoteAction(null)}
          transparent
          visible={!!selectedNoteAction}>
          <View style={styles.modalBackdrop}>
            <Pressable
              onPress={() => setSelectedNoteAction(null)}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.actionSheetCard}>
              <View style={styles.actionSheetHandle} />
              <ThemedText style={styles.actionSheetTitle}>
                {selectedNoteAction?.title || 'Note actions'}
              </ThemedText>
              <ThemedText style={styles.actionSheetSubtitle}>
                Open the file, update the note details, or remove it from this subject.
              </ThemedText>

              <Pressable
                onPress={() => {
                  if (selectedNoteAction) {
                    void openNote(selectedNoteAction);
                  }
                  setSelectedNoteAction(null);
                }}
                style={styles.actionSheetButton}>
                <MaterialIcons name="open-in-new" size={20} color="#12634B" />
                <ThemedText style={styles.actionSheetButtonText}>Open</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (selectedNoteAction) {
                    startEditNote(selectedNoteAction);
                  }
                }}
                style={styles.actionSheetButton}>
                <MaterialIcons name="edit" size={20} color="#12634B" />
                <ThemedText style={styles.actionSheetButtonText}>Edit</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (selectedNoteAction) {
                    setDeleteCandidateNote(selectedNoteAction);
                    setSelectedNoteAction(null);
                  }
                }}
                style={[styles.actionSheetButton, styles.actionSheetDeleteButton]}>
                <MaterialIcons name="delete-outline" size={20} color="#B42318" />
                <ThemedText style={styles.actionSheetDeleteText}>Delete</ThemedText>
              </Pressable>

              <Pressable onPress={() => setSelectedNoteAction(null)} style={styles.actionSheetCancelButton}>
                <ThemedText style={styles.actionSheetCancelText}>Cancel</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => {
            if (!isDeletingNote) {
              setDeleteCandidateNote(null);
            }
          }}
          transparent
          visible={!!deleteCandidateNote}>
          <View style={styles.modalBackdrop}>
            <Pressable
              onPress={() => {
                if (!isDeletingNote) {
                  setDeleteCandidateNote(null);
                }
              }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.confirmCard}>
              <View style={styles.confirmIconWrap}>
                <MaterialIcons name="delete-outline" size={24} color="#B42318" />
              </View>
              <ThemedText style={styles.confirmTitle}>Delete whole note?</ThemedText>
              <ThemedText style={styles.confirmText}>
                {`This will remove "${deleteCandidateNote?.title || 'this note'}" and all its attached files from your subject.`}
              </ThemedText>

              <View style={styles.confirmActions}>
                <Pressable
                  disabled={isDeletingNote}
                  onPress={() => setDeleteCandidateNote(null)}
                  style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  disabled={isDeletingNote}
                  onPress={() => {
                    if (deleteCandidateNote) {
                      void handleDeleteNote(deleteCandidateNote);
                    }
                  }}
                  style={[styles.confirmDeleteButton, isDeletingNote && styles.primaryButtonDisabled]}>
                  <MaterialIcons name="delete" size={18} color="#F7FBF9" />
                  <ThemedText style={styles.confirmDeleteButtonText}>
                    {isDeletingNote ? 'Deleting...' : 'Delete note'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <FacultyBottomNav activeRoute="/faculty-notes" />
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
    backgroundColor: '#12634B',
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroGlowLarge: {
    backgroundColor: '#2A8A67',
    borderRadius: 999,
    height: 220,
    position: 'absolute',
    right: -80,
    top: -40,
    width: 220,
  },
  heroGlowSmall: {
    backgroundColor: '#9AE0C3',
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
    maxWidth: 330,
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
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  panelTitle: {
    color: '#17332A',
  },
  panelSubtitle: {
    color: '#5A756B',
    marginTop: 4,
  },
  readyChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#D7F0E5',
    borderColor: '#12634B',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readyChipText: {
    color: '#12634B',
    fontSize: 12,
    fontWeight: '800',
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#17332A',
    fontSize: 14,
    fontWeight: '700',
  },
  subjectCard: {
    backgroundColor: '#12634B',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  subjectCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  subjectCardIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  subjectCardBody: {
    flex: 1,
    minWidth: 0,
  },
  subjectCardLabel: {
    color: 'rgba(247,251,249,0.76)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subjectCardTitle: {
    color: '#F7FBF9',
    fontSize: 18,
    fontWeight: '800',
  },
  subjectCardMeta: {
    color: 'rgba(247,251,249,0.78)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  subjectCardMetaSecondary: {
    color: '#D7F0E5',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  subjectLoadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  subjectLoadingText: {
    color: 'rgba(247,251,249,0.8)',
    fontSize: 13,
  },
  subjectMetricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  subjectMetricCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  subjectMetricValue: {
    color: '#F7FBF9',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  subjectMetricLabel: {
    color: '#D7F0E5',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  subjectMetricDetail: {
    color: 'rgba(247,251,249,0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    color: '#17332A',
    flex: 1,
    fontSize: 15,
    paddingVertical: 15,
  },
  textareaShell: {
    alignItems: 'flex-start',
    minHeight: 118,
    paddingBottom: 10,
    paddingTop: 12,
  },
  textarea: {
    color: '#17332A',
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 90,
    width: '100%',
  },
  uploadCard: {
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 4,
    padding: 16,
  },
  uploadHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  uploadTitle: {
    color: '#17332A',
    fontSize: 18,
    fontWeight: '800',
  },
  uploadSubtitle: {
    color: '#5A756B',
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 250,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#12634B',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  uploadButtonText: {
    color: '#F7FBF9',
    fontSize: 13,
    fontWeight: '800',
  },
  dropZone: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#9ED6BE',
    borderRadius: 22,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 26,
  },
  dropZoneTitle: {
    color: '#17332A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  dropZoneText: {
    color: '#5A756B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  fileList: {
    gap: 10,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  listSectionTitle: {
    color: '#17332A',
    fontSize: 17,
    fontWeight: '800',
  },
  listSectionSubtitle: {
    color: '#5A756B',
    lineHeight: 20,
    marginTop: 4,
  },
  fileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedFileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#9ED6BE',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedFilesList: {
    gap: 10,
  },
  fileIconWrap: {
    alignItems: 'center',
    backgroundColor: '#D7F0E5',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  fileBody: {
    flex: 1,
  },
  fileLabel: {
    color: '#17332A',
    fontSize: 14,
    fontWeight: '700',
  },
  fileMeta: {
    color: '#5A756B',
    fontSize: 12,
    marginTop: 4,
  },
  fileDescription: {
    color: '#5A756B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  fileAction: {
    padding: 4,
  },
  emptyStateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E4DC',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyStateTitle: {
    color: '#17332A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#5A756B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#EEF5F1',
    borderColor: '#D6E4DC',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#17332A',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#12634B',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.72,
  },
  primaryButtonText: {
    color: '#F7FBF9',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(10, 33, 26, 0.34)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    maxHeight: '88%',
    overflow: 'hidden',
    paddingTop: 18,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 760,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  modalEyebrow: {
    color: '#12634B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: '#17332A',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  modalCloseButton: {
    alignItems: 'center',
    backgroundColor: '#EEF5F1',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  modalInfoCard: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
    padding: 14,
  },
  modalInfoBody: {
    flex: 1,
  },
  modalInfoTitle: {
    color: '#17332A',
    fontSize: 14,
    fontWeight: '700',
  },
  modalInfoText: {
    color: '#5A756B',
    fontSize: 12,
    marginTop: 4,
  },
  modalAttachmentsList: {
    gap: 10,
  },
  modalAttachmentCard: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalAttachmentEmpty: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  modalAttachmentEmptyText: {
    color: '#5A756B',
    fontSize: 13,
    textAlign: 'center',
  },
  editUploadHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  editUploadTitleWrap: {
    flex: 1,
  },
  editUploadSubtitle: {
    color: '#5A756B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  editUploadButton: {
    alignItems: 'center',
    backgroundColor: '#12634B',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editUploadButtonText: {
    color: '#F7FBF9',
    fontSize: 13,
    fontWeight: '800',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  modalSection: {
    gap: 8,
  },
  modalFooter: {
    borderTopColor: '#E2ECE7',
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  actionSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    gap: 12,
    padding: 18,
  },
  actionSheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#D6E4DC',
    borderRadius: 999,
    height: 5,
    marginBottom: 4,
    width: 52,
  },
  actionSheetTitle: {
    color: '#17332A',
    fontSize: 20,
    fontWeight: '800',
  },
  actionSheetSubtitle: {
    color: '#5A756B',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionSheetButton: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  actionSheetButtonText: {
    color: '#17332A',
    fontSize: 15,
    fontWeight: '700',
  },
  actionSheetDeleteButton: {
    backgroundColor: '#FFF3F2',
    borderColor: '#F7C6C1',
  },
  actionSheetDeleteText: {
    color: '#B42318',
    fontSize: 15,
    fontWeight: '700',
  },
  actionSheetCancelButton: {
    alignItems: 'center',
    backgroundColor: '#EEF5F1',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 2,
  },
  actionSheetCancelText: {
    color: '#17332A',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    gap: 12,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  confirmIconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF3F2',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  confirmTitle: {
    color: '#17332A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmText: {
    color: '#5A756B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  confirmDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#B42318',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  confirmDeleteButtonText: {
    color: '#F7FBF9',
    fontSize: 15,
    fontWeight: '800',
  },
});
