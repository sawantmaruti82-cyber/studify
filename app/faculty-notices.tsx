import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FacultyBottomNav } from '@/components/faculty-bottom-nav';
import { ThemedText } from '@/components/themed-text';

const noticeDrafts = [
  {
    category: 'Department',
    title: 'Internal viva schedule',
    body: 'Updated viva slots and lab allocation shared by the HOD for all Computer Science faculty.',
    meta: 'From HOD • Today',
  },
  {
    category: 'Meeting',
    title: 'Faculty meeting at 3:00 PM',
    body: 'Department discussion for timetable planning and semester progress review.',
    meta: 'From HOD • Priority',
  },
  {
    category: 'Academic',
    title: 'Assessment submission window',
    body: 'Upload internal marks and attendance sheets before the end of the week.',
    meta: 'From HOD • This week',
  },
] as const;

export default function FacultyNoticesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <MaterialIcons name="campaign" size={16} color="#F7FBF9" />
                <ThemedText style={styles.badgeText}>Notices</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/faculty-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F7FBF9" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name="campaign" size={34} color="#F7FBF9" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Department notices.
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              This screen is only for reading HOD and department notices. Faculty do not create notices here.
            </ThemedText>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Notice board
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>
                  Important academic and department updates shared from the HOD side.
                </ThemedText>
              </View>
              <View style={styles.readyChip}>
                <ThemedText style={styles.readyChipText}>Read only</ThemedText>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <MaterialIcons name="info-outline" size={22} color="#8A4A12" />
              </View>
              <View style={styles.infoBody}>
                <ThemedText style={styles.infoTitle}>Notices come from HOD</ThemedText>
                <ThemedText style={styles.infoText}>
                  Faculty can view department notices here, while reminders and lecture alerts stay in Notifications.
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  Notice preview ideas
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>
                  Sample notice cards to guide the final faculty notices experience.
                </ThemedText>
              </View>
            </View>

            <View style={styles.noticeList}>
              {noticeDrafts.map((notice) => (
                <View key={notice.title} style={styles.noticeCard}>
                  <View style={styles.noticeTopRow}>
                    <View style={styles.noticeIconWrap}>
                      <MaterialIcons name="campaign" size={20} color="#8A4A12" />
                    </View>
                    <View style={styles.noticeTag}>
                      <ThemedText style={styles.noticeTagText}>{notice.category}</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.noticeTitle}>{notice.title}</ThemedText>
                  <ThemedText style={styles.noticeText}>{notice.body}</ThemedText>
                  <ThemedText style={styles.noticeMeta}>{notice.meta}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <FacultyBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7EF',
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
    backgroundColor: '#8A4A12',
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroGlowLarge: {
    backgroundColor: '#C77224',
    borderRadius: 999,
    height: 220,
    position: 'absolute',
    right: -80,
    top: -40,
    width: 220,
  },
  heroGlowSmall: {
    backgroundColor: '#F5C387',
    borderRadius: 999,
    height: 120,
    left: -26,
    position: 'absolute',
    top: 126,
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
    maxWidth: 320,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EDDACA',
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
    color: '#4A2B13',
  },
  panelSubtitle: {
    color: '#8A633B',
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 280,
  },
  readyChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDE7D1',
    borderColor: '#C77224',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readyChipText: {
    color: '#8A4A12',
    fontSize: 12,
    fontWeight: '800',
  },
  infoCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7EF',
    borderColor: '#EDDACA',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
    padding: 16,
  },
  infoIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FDE7D1',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  infoBody: {
    flex: 1,
  },
  infoTitle: {
    color: '#4A2B13',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoText: {
    color: '#8A633B',
    fontSize: 15,
    lineHeight: 22,
  },
  noticeList: {
    gap: 12,
  },
  noticeCard: {
    backgroundColor: '#FFF7EF',
    borderColor: '#EDDACA',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  noticeTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  noticeIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FDE7D1',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  noticeTag: {
    backgroundColor: '#FDE7D1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noticeTagText: {
    color: '#8A4A12',
    fontSize: 11,
    fontWeight: '800',
  },
  noticeTitle: {
    color: '#4A2B13',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  noticeText: {
    color: '#8A633B',
    fontSize: 14,
    lineHeight: 20,
  },
  noticeMeta: {
    color: '#8A633B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
});
