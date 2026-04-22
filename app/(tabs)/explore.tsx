import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

const updates = [
  {
    title: 'Student section',
    detail: 'Semester timetable and assignment reminders were published for Computer Science students.',
    time: '11:12 PM',
  },
  {
    title: 'Faculty section',
    detail: 'Attendance register and meeting circular were shared with Computer Science faculty members.',
    time: '10:48 PM',
  },
  {
    title: 'HOD section',
    detail: 'Computer Science approvals, notices, and reports are ready for HOD review.',
    time: '09:55 PM',
  },
] as const;

const palettes = {
  light: {
    background: '#F4F7FB',
    card: '#FFFFFF',
    border: '#D7E0EA',
    text: '#132238',
    muted: '#60758A',
    accent: '#113B63',
  },
  dark: {
    background: '#09111B',
    card: '#111D2C',
    border: '#223448',
    text: '#F4F7FB',
    muted: '#9EB1C6',
    accent: '#8EE3F5',
  },
} as const;

export default function UpdatesScreen() {
  const colorScheme = useColorScheme();
  const palette = palettes[colorScheme === 'dark' ? 'dark' : 'light'];
  const showTapMessage = (title: string, detail: string) => {
    Alert.alert(title, detail);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}>
          <View style={styles.headerTopRow}>
            <ThemedText type="title" style={{ color: palette.text }}>
              CS feed
            </ThemedText>
            <MaterialIcons name="history" size={24} color={palette.accent} />
          </View>
          <ThemedText style={{ color: palette.muted }}>
            A role-based activity feed for the Computer Science department.
          </ThemedText>
        </View>

        {updates.map((update) => (
          <Pressable
            key={`${update.title}-${update.time}`}
            onPress={() => showTapMessage(update.title, update.detail)}
            style={[
              styles.updateCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
              },
            ]}>
            <View style={[styles.updateIcon, { backgroundColor: `${palette.accent}18` }]}>
              <MaterialIcons name="notifications" size={22} color={palette.accent} />
            </View>
            <View style={styles.updateBody}>
              <View style={styles.updateHeader}>
                <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>
                  {update.title}
                </ThemedText>
                <ThemedText style={{ color: palette.muted }}>{update.time}</ThemedText>
              </View>
              <ThemedText style={{ color: palette.muted }}>{update.detail}</ThemedText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  updateCard: {
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  updateIcon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  updateBody: {
    flex: 1,
    gap: 6,
  },
  updateHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
