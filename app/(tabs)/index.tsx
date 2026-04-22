import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

const quickActions = [
  { icon: 'fact-check', label: 'Attendance', hint: 'Mark and review class attendance' },
  { icon: 'campaign', label: 'Notices', hint: 'Send updates to students and staff' },
  { icon: 'menu-book', label: 'Materials', hint: 'Share notes and assignments' },
  { icon: 'account-balance', label: 'CS Office', hint: 'Manage faculty and HOD approvals' },
] as const;

const recentAlerts = [
  {
    title: 'Internal exam timetable updated',
    message: 'Third year students were notified about the revised test schedule.',
    time: '2 min ago',
    tone: '#FF8A65',
  },
  {
    title: 'Faculty meeting reminder',
    message: 'All faculty members received the HOD meeting notice for 2:00 PM.',
    time: '18 min ago',
    tone: '#2EC4B6',
  },
  {
    title: 'Assignment submission deadline',
    message: 'Final year students were reminded to submit project abstracts today.',
    time: '43 min ago',
    tone: '#5C7CFA',
  },
] as const;

const userGroups = [
  { label: 'Students', count: '1,284', icon: 'school' },
  { label: 'Faculty', count: '86', icon: 'co-present' },
  { label: 'HOD / Admin', count: '12', icon: 'badge' },
] as const;

const palettes = {
  light: {
    background: '#F4F7FB',
    card: '#FFFFFF',
    border: '#D7E0EA',
    hero: '#113B63',
    heroAccent: '#7AD7F0',
    heroSoft: '#1E5D8C',
    text: '#132238',
    muted: '#60758A',
    success: '#1E9E6A',
    warning: '#F28C28',
  },
  dark: {
    background: '#09111B',
    card: '#111D2C',
    border: '#223448',
    hero: '#0E2B47',
    heroAccent: '#8EE3F5',
    heroSoft: '#163A5E',
    text: '#F4F7FB',
    muted: '#9EB1C6',
    success: '#45C48A',
    warning: '#F5A948',
  },
} as const;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const palette = palettes[colorScheme === 'dark' ? 'dark' : 'light'];
  const showTapMessage = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: palette.hero }]}>
          <View style={[styles.heroGlow, styles.heroGlowLarge, { backgroundColor: palette.heroSoft }]} />
          <View style={[styles.heroGlow, styles.heroGlowSmall, { backgroundColor: palette.heroAccent }]} />

          <View style={styles.heroTopRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <MaterialIcons name="notifications-active" size={16} color="#F8FBFF" />
              <ThemedText style={styles.badgeText}>Computer Science</ThemedText>
            </View>
            <MaterialIcons name="tune" size={22} color="#F8FBFF" />
          </View>

          <ThemedText type="title" style={styles.heroTitle}>
            One department app for Computer Science.
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Manage attendance, notices, classes, and communication for the Computer Science department.
          </ThemedText>

          <View style={styles.heroStatsRow}>
            <View style={[styles.heroStatCard, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <ThemedText style={styles.heroStatValue}>42</ThemedText>
              <ThemedText style={styles.heroStatLabel}>Classes today</ThemedText>
            </View>
            <View style={[styles.heroStatCard, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <ThemedText style={styles.heroStatValue}>91%</ThemedText>
              <ThemedText style={styles.heroStatLabel}>Notice reach</ThemedText>
            </View>
            <View style={[styles.heroStatCard, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <ThemedText style={styles.heroStatValue}>1</ThemedText>
              <ThemedText style={styles.heroStatLabel}>Department</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="subtitle" style={{ color: palette.text }}>
              User groups
            </ThemedText>
            <ThemedText style={{ color: palette.muted }}>
              The people this app serves in Computer Science.
            </ThemedText>
          </View>
        </View>

        <View style={styles.groupRow}>
          {userGroups.map((group) => (
            <Pressable
              key={group.label}
              onPress={() =>
                showTapMessage(group.label, `${group.count} active users in Computer Science.`)
              }
              style={[
                styles.groupCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}>
              <View style={[styles.groupIconWrap, { backgroundColor: `${palette.hero}12` }]}>
                <MaterialIcons name={group.icon} size={22} color={palette.hero} />
              </View>
              <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>
                {group.label}
              </ThemedText>
              <ThemedText style={{ color: palette.muted }}>{group.count} active</ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="subtitle" style={{ color: palette.text }}>
              Quick actions
            </ThemedText>
            <ThemedText style={{ color: palette.muted }}>
              Shortcuts for the work you do most.
            </ThemedText>
          </View>
          <Pressable onPress={() => showTapMessage('Quick actions', 'More shortcuts will open here soon.')}>
            <ThemedText type="link">See all</ThemedText>
          </Pressable>
        </View>

        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => showTapMessage(action.label, action.hint)}
              style={[
                styles.actionCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}>
              <View style={[styles.actionIconWrap, { backgroundColor: `${palette.hero}12` }]}>
                <MaterialIcons name={action.icon} size={24} color={palette.hero} />
              </View>
              <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>
                {action.label}
              </ThemedText>
              <ThemedText style={{ color: palette.muted }}>{action.hint}</ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="subtitle" style={{ color: palette.text }}>
              Recent notices
            </ThemedText>
            <ThemedText style={{ color: palette.muted }}>
              The latest academic activity from Computer Science.
            </ThemedText>
          </View>
          <Pressable onPress={() => showTapMessage('Recent notices', 'The full notice list will open here soon.')}>
            <ThemedText type="link">See notices</ThemedText>
          </Pressable>
        </View>

        <View style={styles.alertList}>
          {recentAlerts.map((alert) => (
            <Pressable
              key={alert.title}
              onPress={() => showTapMessage(alert.title, alert.message)}
              style={[
                styles.alertCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}>
              <View style={[styles.alertDot, { backgroundColor: alert.tone }]} />
              <View style={styles.alertBody}>
                <View style={styles.alertHeader}>
                  <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>
                    {alert.title}
                  </ThemedText>
                  <ThemedText style={{ color: palette.muted }}>{alert.time}</ThemedText>
                </View>
                <ThemedText style={{ color: palette.muted }}>{alert.message}</ThemedText>
              </View>
            </Pressable>
          ))}
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}>
          <View style={styles.summaryHeader}>
            <View>
              <ThemedText type="subtitle" style={{ color: palette.text }}>
                Today&apos;s status
              </ThemedText>
              <ThemedText style={{ color: palette.muted }}>
                A quick view of Computer Science operations.
              </ThemedText>
            </View>
            <MaterialIcons name="insights" size={24} color={palette.hero} />
          </View>

          <Pressable
            onPress={() => showTapMessage('Attendance submitted', '34 of 42 classes have submitted attendance.')}
            style={[styles.summaryRow, { borderTopColor: palette.border }]}>
            <ThemedText style={{ color: palette.muted }}>Attendance submitted</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: palette.success }}>
              34 / 42 classes
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => showTapMessage('Pending leave approvals', '7 leave requests are waiting for review.')}
            style={[styles.summaryRow, { borderTopColor: palette.border }]}>
            <ThemedText style={{ color: palette.muted }}>Pending leave approvals</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>
              7
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => showTapMessage('Unread student notices', '18 student notices still need attention.')}
            style={[styles.summaryRow, { borderTopColor: palette.border }]}>
            <ThemedText style={{ color: palette.muted }}>Unread student notices</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: palette.warning }}>
              18 need review
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 22,
  },
  heroCard: {
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroGlow: {
    borderRadius: 999,
    position: 'absolute',
  },
  heroGlowLarge: {
    height: 220,
    right: -80,
    top: -40,
    width: 220,
  },
  heroGlowSmall: {
    height: 100,
    left: -30,
    top: 110,
    width: 100,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
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
  heroTitle: {
    color: '#F8FBFF',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(248,251,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
    maxWidth: 320,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStatCard: {
    borderRadius: 18,
    flex: 1,
    padding: 14,
  },
  heroStatValue: {
    color: '#F8FBFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroStatLabel: {
    color: 'rgba(248,251,255,0.74)',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupRow: {
    flexDirection: 'row',
    gap: 12,
  },
  groupCard: {
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    minHeight: 122,
    padding: 16,
  },
  groupIconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    marginBottom: 14,
    width: 42,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    borderRadius: 22,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 138,
    padding: 16,
    width: '47%',
  },
  actionIconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    marginBottom: 16,
    width: 46,
  },
  alertList: {
    gap: 12,
  },
  alertCard: {
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  alertDot: {
    borderRadius: 999,
    height: 12,
    marginTop: 6,
    width: 12,
  },
  alertBody: {
    flex: 1,
    gap: 8,
  },
  alertHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 4,
    padding: 18,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
});
