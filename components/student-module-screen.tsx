import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNav } from '@/components/student-bottom-nav';
import { ThemedText } from '@/components/themed-text';

type StudentModuleRoute =
  | '/student-attendance'
  | '/student-assignments'
  | '/student-notes'
  | '/student-notifications';

type StudentModuleScreenProps = {
  activeRoute?: StudentModuleRoute;
  title: string;
  subtitle: string;
  sectionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  heroIcon: keyof typeof MaterialIcons.glyphMap;
  accentColor: string;
  accentSoft: string;
};

export function StudentModuleScreen({
  activeRoute,
  title,
  subtitle,
  sectionLabel,
  emptyTitle,
  emptyDescription,
  heroIcon,
  accentColor,
  accentSoft,
}: StudentModuleScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: accentColor }]}>
            <View style={[styles.heroGlowLarge, { backgroundColor: accentSoft }]} />
            <View style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <View style={styles.badge}>
                <MaterialIcons name={heroIcon} size={16} color="#F8FBFF" />
                <ThemedText style={styles.badgeText}>{sectionLabel}</ThemedText>
              </View>
              <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.dashboardButton}>
                <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
                <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroIconWrap}>
              <MaterialIcons name={heroIcon} size={34} color="#F8FBFF" />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              {title}
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>{subtitle}</ThemedText>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle" style={styles.panelTitle}>
                  {sectionLabel}
                </ThemedText>
                <ThemedText style={styles.panelSubtitle}>A dedicated screen is ready for this module.</ThemedText>
              </View>
              <View style={[styles.statusChip, { backgroundColor: accentSoft, borderColor: accentColor }]}>
                <ThemedText style={[styles.statusChipText, { color: accentColor }]}>Coming soon</ThemedText>
              </View>
            </View>

            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconWrap, { backgroundColor: accentSoft }]}>
                <MaterialIcons name={heroIcon} size={30} color={accentColor} />
              </View>
              <ThemedText style={styles.emptyTitle}>{emptyTitle}</ThemedText>
              <ThemedText style={styles.emptyDescription}>{emptyDescription}</ThemedText>
            </View>
          </View>
        </ScrollView>

        <StudentBottomNav activeRoute={activeRoute} />
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
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroGlowLarge: {
    borderRadius: 999,
    height: 220,
    position: 'absolute',
    right: -80,
    top: -40,
    width: 220,
  },
  heroGlowSmall: {
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    maxWidth: 320,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
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
    color: '#132238',
  },
  panelSubtitle: {
    color: '#60758A',
    marginTop: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: 22,
    height: 68,
    justifyContent: 'center',
    marginBottom: 18,
    width: 68,
  },
  emptyTitle: {
    color: '#132238',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#60758A',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
});
