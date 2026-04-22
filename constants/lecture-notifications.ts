import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { API_URL } from '@/constants/api';
import { getSession, SessionData } from '@/constants/session';
import { formatCollegeTime, groupTimetableByDay, TimetableEntry, weekdayOrder } from '@/constants/timetable';

const REMINDER_STATE_KEY = 'studify_student_reminder_state';
const REMINDER_CHANNEL_ID = 'student-lecture-reminders';
const NOTIFICATION_FEED_KEY = 'studify_notification_feed';
const NOTE_SYNC_STATE_KEY = 'studify_note_notification_state';
const TEST_REMINDER_STATE_KEY = 'studify_test_reminder_state';
const REMINDER_WINDOW_DAYS = 7;
const LECTURE_REMINDER_MINUTES = 15;
const NIGHTLY_REMINDER_HOUR = 23;
const NIGHTLY_REMINDER_MINUTE = 47;

type SubjectMeta = {
  facultyId?: string;
  facultyName?: string;
  subjectId?: string;
};

type ScheduledReminderState = {
  fingerprint: string;
  ids: string[];
};

type ReminderSpec = {
  audience: 'student' | 'faculty';
  body: string;
  date: Date;
  key: string;
  title: string;
  type: 'lecture' | 'nightly';
};

type ReminderSyncOptions = {
  force?: boolean;
  promptForPermission?: boolean;
  timetable?: TimetableEntry[];
};

type ReminderSyncResult = {
  granted: boolean;
  reason?: 'no-session' | 'not-student' | 'permission-denied';
  scheduledCount: number;
  skipped: boolean;
};

export type NotificationAudience = 'student' | 'faculty';

export type NotificationFeedItem = {
  audience: NotificationAudience;
  body: string;
  deliveredAt?: string;
  key: string;
  read: boolean;
  scheduledFor: string;
  screen: string;
  status: 'delivered' | 'scheduled';
  title: string;
  type: 'lecture' | 'nightly' | 'note';
};

type StoredNoteNotificationState = {
  knownIds: string[];
};

type UploadedNoteFeedItem = {
  _id?: string;
  facultyName?: string;
  subjectId?: string;
  subjectName?: string;
  title?: string;
  uploadedAt?: string;
};

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayNameForDate(date: Date) {
  const dayIndex = date.getDay();
  return dayIndex === 0 ? 'Sunday' : weekdayOrder[dayIndex - 1];
}

function shiftDate(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getStartOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function parseStoredCollegeTime(timeValue: string) {
  const [rawHourText, rawMinuteText] = timeValue.split(':');
  const rawHour = Number(rawHourText);
  const minute = Number(rawMinuteText);

  if (!Number.isFinite(rawHour) || !Number.isFinite(minute)) {
    return { hour: 0, minute: 0 };
  }

  if (rawHour >= 1 && rawHour <= 7) {
    return { hour: rawHour + 12, minute };
  }

  return { hour: rawHour, minute };
}

function combineDateAndTime(date: Date, timeValue: string) {
  const nextDate = new Date(date);
  const { hour, minute } = parseStoredCollegeTime(timeValue);
  nextDate.setHours(hour, minute, 0, 0);
  return nextDate;
}

function buildLectureBody(entry: TimetableEntry) {
  const roomText = entry.room ? ` in ${entry.room}` : '';
  return `${entry.subjectName} starts at ${formatCollegeTime(entry.startTime)}${roomText}.`;
}

function buildNightlyBody(entry: TimetableEntry) {
  const roomText = entry.room ? ` in ${entry.room}` : '';
  return `${entry.subjectName} begins at ${formatCollegeTime(entry.startTime)} tomorrow${roomText}.`;
}

function buildFacultyNightlyBody(entries: TimetableEntry[]) {
  const lectureSummary = entries
    .map((entry) => `${entry.subjectName} at ${formatCollegeTime(entry.startTime)}`)
    .join(', ');

  return `Tomorrow's lectures: ${lectureSummary}.`;
}

function buildStudentReminderPlan(timetable: TimetableEntry[], now = new Date()) {
  const groupedTimetable = groupTimetableByDay(timetable);
  const timetableByDay = new Map(groupedTimetable.map((group) => [group.day, group.items]));
  const upcomingReminders: ReminderSpec[] = [];
  const today = getStartOfDay(now);

  for (let offset = 0; offset < REMINDER_WINDOW_DAYS; offset += 1) {
    const targetDate = shiftDate(today, offset);
    const dayName = getDayNameForDate(targetDate);
    const dayEntries = timetableByDay.get(dayName) ?? [];

    if (!dayEntries.length) {
      continue;
    }

    for (const entry of dayEntries) {
      const lectureStart = combineDateAndTime(targetDate, entry.startTime);
      const lectureReminderDate = new Date(lectureStart.getTime() - LECTURE_REMINDER_MINUTES * 60 * 1000);

      if (lectureReminderDate <= now) {
        continue;
      }

      upcomingReminders.push({
        audience: 'student',
        body: buildLectureBody(entry),
        date: lectureReminderDate,
        key: `${getLocalDateKey(targetDate)}-${entry.subjectName}-${entry.startTime}-lecture`,
        title: `${entry.subjectName} in 15 minutes`,
        type: 'lecture',
      });
    }

    const firstLecture = dayEntries[0];
    const nightlyReminderDate = combineDateAndTime(shiftDate(targetDate, -1), `${`${NIGHTLY_REMINDER_HOUR}`.padStart(2, '0')}:${`${NIGHTLY_REMINDER_MINUTE}`.padStart(2, '0')}`);

    if (firstLecture && nightlyReminderDate > now) {
      upcomingReminders.push({
        audience: 'student',
        body: buildNightlyBody(firstLecture),
        date: nightlyReminderDate,
        key: `${getLocalDateKey(targetDate)}-nightly-first-lecture`,
        title: "Tomorrow's first lecture",
        type: 'nightly',
      });
    }
  }

  return upcomingReminders.sort((first, second) => first.date.getTime() - second.date.getTime());
}

function buildFacultyReminderPlan(timetable: TimetableEntry[], now = new Date()) {
  const groupedTimetable = groupTimetableByDay(timetable);
  const timetableByDay = new Map(groupedTimetable.map((group) => [group.day, group.items]));
  const upcomingReminders: ReminderSpec[] = [];
  const today = getStartOfDay(now);
  const nightlyTimeValue = `${`${NIGHTLY_REMINDER_HOUR}`.padStart(2, '0')}:${`${NIGHTLY_REMINDER_MINUTE}`.padStart(2, '0')}`;

  for (let offset = 1; offset <= REMINDER_WINDOW_DAYS; offset += 1) {
    const targetDate = shiftDate(today, offset);
    const dayName = getDayNameForDate(targetDate);
    const dayEntries = timetableByDay.get(dayName) ?? [];

    if (!dayEntries.length) {
      continue;
    }

    const nightlyReminderDate = combineDateAndTime(shiftDate(targetDate, -1), nightlyTimeValue);

    if (nightlyReminderDate <= now) {
      continue;
    }

    upcomingReminders.push({
      audience: 'faculty',
      body: buildFacultyNightlyBody(dayEntries),
      date: nightlyReminderDate,
      key: `${getLocalDateKey(targetDate)}-faculty-nightly-lectures`,
      title: `Tomorrow's ${dayEntries.length === 1 ? 'lecture' : 'lectures'}`,
      type: 'nightly',
    });
  }

  return upcomingReminders.sort((first, second) => first.date.getTime() - second.date.getTime());
}

function buildReminderFingerprint(reminders: ReminderSpec[]) {
  return JSON.stringify(
    reminders.map((reminder) => ({
      audience: reminder.audience,
      date: reminder.date.toISOString(),
      key: reminder.key,
      type: reminder.type,
    }))
  );
}

async function getStoredReminderState() {
  const storedValue = await AsyncStorage.getItem(REMINDER_STATE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as ScheduledReminderState;
  } catch {
    await AsyncStorage.removeItem(REMINDER_STATE_KEY);
    return null;
  }
}

async function saveReminderState(state: ScheduledReminderState) {
  await AsyncStorage.setItem(REMINDER_STATE_KEY, JSON.stringify(state));
}

async function getStoredNotificationFeed() {
  const storedValue = await AsyncStorage.getItem(NOTIFICATION_FEED_KEY);

  if (!storedValue) {
    return [] as NotificationFeedItem[];
  }

  try {
    const parsed = JSON.parse(storedValue) as NotificationFeedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await AsyncStorage.removeItem(NOTIFICATION_FEED_KEY);
    return [] as NotificationFeedItem[];
  }
}

async function saveNotificationFeed(items: NotificationFeedItem[]) {
  await AsyncStorage.setItem(NOTIFICATION_FEED_KEY, JSON.stringify(items));
}

async function getStoredNoteNotificationState() {
  const storedValue = await AsyncStorage.getItem(NOTE_SYNC_STATE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as StoredNoteNotificationState;
  } catch {
    await AsyncStorage.removeItem(NOTE_SYNC_STATE_KEY);
    return null;
  }
}

async function saveStoredNoteNotificationState(state: StoredNoteNotificationState) {
  await AsyncStorage.setItem(NOTE_SYNC_STATE_KEY, JSON.stringify(state));
}

function buildNoteNotificationKey(noteId?: string) {
  return `note-${noteId || 'unknown'}`;
}

function buildStudentNoteNotificationTitle(note: UploadedNoteFeedItem) {
  return `New note in ${note.subjectName || 'your subject'}`;
}

function buildStudentNoteNotificationBody(note: UploadedNoteFeedItem) {
  const facultyText = note.facultyName || 'Your teacher';
  const titleText = note.title || 'a new note';
  return `${facultyText} uploaded ${titleText}.`;
}

function getReminderTargetScreen(
  audience: NotificationAudience,
  type: NotificationFeedItem['type']
) {
  if (audience === 'faculty') {
    return '/faculty-notifications';
  }

  if (type === 'lecture') {
    return '/student-timetable';
  }

  if (type === 'note') {
    return '/student-notes';
  }

  return '/student-notifications';
}

async function syncNotificationFeedForAudience(audience: NotificationAudience, reminders: ReminderSpec[]) {
  const existingItems = await getStoredNotificationFeed();
  const preservedItems = existingItems.filter(
    (item) => !(item.audience === audience && item.status === 'scheduled')
  );
  const reminderItems: NotificationFeedItem[] = reminders.map((reminder) => ({
    audience,
    body: reminder.body,
    key: reminder.key,
    read: false,
    scheduledFor: reminder.date.toISOString(),
    screen: getReminderTargetScreen(audience, reminder.type),
    status: 'scheduled',
    title: reminder.title,
    type: reminder.type,
  }));

  await saveNotificationFeed([...preservedItems, ...reminderItems]);
}

async function fetchApiJson(path: string) {
  const response = await fetch(`${API_URL}${path}`);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `Unable to load ${path} for notifications.`);
  }

  return data;
}

async function fetchTimetableForReminders(session: SessionData) {
  const timetableData = await fetchApiJson('/timetable');
  const timetable = (Array.isArray(timetableData.timetable) ? timetableData.timetable : []) as TimetableEntry[];

  if (session.user.role !== 'faculty') {
    return timetable;
  }

  const teacherName = session.user.fullName?.trim().toLowerCase();

  if (!teacherName) {
    return [];
  }

  const subjectsData = await fetchApiJson('/subjects');
  const subjects = Array.isArray(subjectsData.subjects) ? (subjectsData.subjects as SubjectMeta[]) : [];
  const teacherSubjects = subjects.filter(
    (subject) => subject.facultyName?.trim().toLowerCase() === teacherName
  );
  const allowedFacultyIds = new Set(
    teacherSubjects.map((subject) => subject.facultyId?.trim()).filter(Boolean)
  );
  const allowedSubjectIds = new Set(
    teacherSubjects.map((subject) => subject.subjectId?.trim()).filter(Boolean)
  );

  return timetable.filter(
    (entry) =>
      (entry.facultyId && allowedFacultyIds.has(entry.facultyId.trim())) ||
      (entry.subjectId && allowedSubjectIds.has(entry.subjectId.trim()))
  );
}

async function fetchUploadedNotesFeed(session: SessionData) {
  if (session.user.role !== 'student') {
    return [] as UploadedNoteFeedItem[];
  }

  const notesData = await fetchApiJson('/notes/feed');
  return Array.isArray(notesData.notes) ? (notesData.notes as UploadedNoteFeedItem[]) : [];
}

function buildReminderPlan(session: SessionData, timetable: TimetableEntry[], now = new Date()) {
  if (session.user.role === 'faculty') {
    return buildFacultyReminderPlan(timetable, now);
  }

  return buildStudentReminderPlan(timetable, now);
}

export async function configureLectureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#8EE3F5',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    name: 'Lecture reminders',
    sound: 'default',
    vibrationPattern: [0, 180, 120, 180],
  });
}

export async function ensureLectureReminderPermissions(promptForPermission = false) {
  await configureLectureNotificationChannel();

  const currentStatus = await Notifications.getPermissionsAsync();

  if (currentStatus.granted || !promptForPermission) {
    return currentStatus;
  }

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
}

export async function clearStudentLectureNotifications() {
  const storedState = await getStoredReminderState();

  if (storedState?.ids?.length) {
    await Promise.allSettled(
      storedState.ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
    );
  }

  await AsyncStorage.removeItem(REMINDER_STATE_KEY);
  await AsyncStorage.removeItem(NOTE_SYNC_STATE_KEY);

  const items = await getStoredNotificationFeed();
  const preservedItems = items.filter((item) => item.audience !== 'student');
  await saveNotificationFeed(preservedItems);
}

export async function getNotificationFeed(audience: NotificationAudience) {
  const items = await getStoredNotificationFeed();

  return items
    .filter((item) => item.audience === audience)
    .sort((first, second) => {
      const firstDate = new Date(first.deliveredAt || first.scheduledFor).getTime();
      const secondDate = new Date(second.deliveredAt || second.scheduledFor).getTime();
      return secondDate - firstDate;
    });
}

export async function getUnreadNotificationCount(audience: NotificationAudience) {
  const items = await getStoredNotificationFeed();

  return items.filter(
    (item) => item.audience === audience && item.status === 'delivered' && !item.read
  ).length;
}

export async function markNotificationFeedAsRead(audience: NotificationAudience) {
  const items = await getStoredNotificationFeed();
  let changed = false;

  const nextItems = items.map((item) => {
    if (item.audience === audience && item.status === 'delivered' && !item.read) {
      changed = true;
      return {
        ...item,
        read: true,
      };
    }

    return item;
  });

  if (changed) {
    await saveNotificationFeed(nextItems);
  }
}

export async function recordDeliveredNotification(notification: {
  audience?: string;
  body?: string | null;
  key?: string;
  screen?: string;
  title?: string | null;
  type?: 'lecture' | 'nightly' | 'note';
}) {
  const audience =
    notification.audience === 'faculty' || notification.audience === 'student'
      ? notification.audience
      : null;

  if (!audience || !notification.key) {
    return;
  }

  const items = await getStoredNotificationFeed();
  const deliveredAt = new Date().toISOString();
  const existingIndex = items.findIndex((item) => item.key === notification.key && item.audience === audience);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      body: notification.body || items[existingIndex].body,
      deliveredAt,
      read: false,
      screen: notification.screen || items[existingIndex].screen,
      status: 'delivered',
      title: notification.title || items[existingIndex].title,
      type: notification.type || items[existingIndex].type,
    };
  } else {
    items.unshift({
      audience,
      body: notification.body || '',
      deliveredAt,
      key: notification.key,
      read: false,
      scheduledFor: deliveredAt,
      screen: notification.screen || getReminderTargetScreen(audience, notification.type || 'nightly'),
      status: 'delivered',
      title: notification.title || 'Studify reminder',
      type: notification.type || 'nightly',
    });
  }

  await saveNotificationFeed(items);
}

export async function syncLectureNotifications(
  session: SessionData,
  options: ReminderSyncOptions = {}
): Promise<ReminderSyncResult> {
  const permissionStatus = await ensureLectureReminderPermissions(Boolean(options.promptForPermission));

  if (!permissionStatus.granted) {
    await clearStudentLectureNotifications();
    return {
      granted: false,
      reason: 'permission-denied',
      scheduledCount: 0,
      skipped: true,
    };
  }

  const timetable = options.timetable ?? (await fetchTimetableForReminders(session));
  const reminders = buildReminderPlan(session, timetable);
  const fingerprint = buildReminderFingerprint(reminders);
  const storedState = await getStoredReminderState();

  if (!options.force && storedState?.fingerprint === fingerprint) {
    return {
      granted: true,
      scheduledCount: storedState.ids.length,
      skipped: true,
    };
  }

  await clearStudentLectureNotifications();

  const nextIds: string[] = [];

  for (const reminder of reminders) {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        body: reminder.body,
        data: {
          reminderKey: reminder.key,
          reminderType: reminder.type,
          screen:
            session.user.role === 'faculty'
              ? '/faculty-dashboard'
              : reminder.type === 'lecture'
                ? '/student-timetable'
                : '/student-dashboard',
          source: 'studify-lecture-reminder',
          userRole: session.user.role,
        },
        sound: 'default',
        title: reminder.title,
      },
      trigger: {
        channelId: REMINDER_CHANNEL_ID,
        date: reminder.date,
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      },
    });

    nextIds.push(identifier);
  }

  await saveReminderState({
    fingerprint,
    ids: nextIds,
  });
  await syncNotificationFeedForAudience(session.user.role, reminders);

  return {
    granted: true,
    scheduledCount: nextIds.length,
    skipped: false,
  };
}

export async function syncStudentUploadedNoteNotifications(
  session: SessionData,
  options: { promptForPermission?: boolean } = {}
) {
  if (session.user.role !== 'student') {
    await AsyncStorage.removeItem(NOTE_SYNC_STATE_KEY);
    return {
      granted: false,
      reason: 'not-student' as const,
      syncedCount: 0,
      skipped: true,
    };
  }

  const permissionStatus = await ensureLectureReminderPermissions(Boolean(options.promptForPermission));
  const notes = await fetchUploadedNotesFeed(session);
  const storedState = await getStoredNoteNotificationState();
  const knownIds = new Set(storedState?.knownIds || []);
  const isFirstSync = !storedState;
  const newNotes = isFirstSync ? [] : notes.filter((note) => note._id && !knownIds.has(note._id));

  for (const note of newNotes) {
    const key = buildNoteNotificationKey(note._id);
    const title = buildStudentNoteNotificationTitle(note);
    const body = buildStudentNoteNotificationBody(note);

    await recordDeliveredNotification({
      audience: 'student',
      body,
      key,
      screen: '/student-notes',
      title,
      type: 'note',
    });

    if (permissionStatus.granted) {
      await Notifications.scheduleNotificationAsync({
        content: {
          body,
          data: {
            reminderKey: key,
            reminderType: 'note',
            screen: '/student-notes',
            source: 'studify-note-upload',
            userRole: 'student',
          },
          sound: 'default',
          title,
        },
        trigger: null,
      });
    }
  }

  await saveStoredNoteNotificationState({
    knownIds: notes
      .map((note) => note._id)
      .filter((noteId): noteId is string => Boolean(noteId))
      .slice(0, 100),
  });

  return {
    granted: permissionStatus.granted,
    skipped: isFirstSync || newNotes.length === 0,
    syncedCount: newNotes.length,
  };
}

export async function syncLectureNotificationsFromStoredSession(
  options: ReminderSyncOptions = {}
): Promise<ReminderSyncResult> {
  const session = await getSession();

  if (!session) {
    await clearStudentLectureNotifications();
    return {
      granted: false,
      reason: 'no-session',
      scheduledCount: 0,
      skipped: true,
    };
  }

  return syncLectureNotifications(session, options);
}

export async function syncStudentUploadedNoteNotificationsFromStoredSession(
  options: { promptForPermission?: boolean } = {}
) {
  const session = await getSession();

  if (!session) {
    await AsyncStorage.removeItem(NOTE_SYNC_STATE_KEY);
    return {
      granted: false,
      reason: 'no-session' as const,
      syncedCount: 0,
      skipped: true,
    };
  }

  return syncStudentUploadedNoteNotifications(session, options);
}

export async function syncStudentLectureNotifications(
  session: SessionData,
  options: ReminderSyncOptions = {}
) {
  return syncLectureNotifications(session, options);
}

export async function syncStudentLectureNotificationsFromStoredSession(
  options: ReminderSyncOptions = {}
) {
  return syncLectureNotificationsFromStoredSession(options);
}

export async function scheduleStudentTestNotification(hour: number, minute: number) {
  const permissionStatus = await ensureLectureReminderPermissions(false);

  if (!permissionStatus.granted) {
    return {
      granted: false,
      skipped: true,
    };
  }

  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setHours(hour, minute, 0, 0);

  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const fingerprint = `${targetDate.toISOString()}-studify-test`;
  const storedFingerprint = await AsyncStorage.getItem(TEST_REMINDER_STATE_KEY);

  if (storedFingerprint === fingerprint) {
    return {
      granted: true,
      skipped: true,
    };
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      body: 'This is your temporary Studify notification test.',
      data: {
        screen: '/student-dashboard',
        source: 'studify-test-reminder',
      },
      sound: 'default',
      title: 'Studify test reminder',
    },
    trigger: {
      channelId: REMINDER_CHANNEL_ID,
      date: targetDate,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  });

  await AsyncStorage.setItem(TEST_REMINDER_STATE_KEY, fingerprint);

  return {
    granted: true,
    identifier,
    skipped: false,
    targetDate: targetDate.toISOString(),
  };
}
