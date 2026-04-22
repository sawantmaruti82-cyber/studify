import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FacultyBottomNav } from '@/components/faculty-bottom-nav';
import { ThemedText } from '@/components/themed-text';

type FacultyNavRoute =
  | '/faculty-attendance'
  | '/faculty-classroom'
  | '/faculty-notes'
  | '/faculty-notifications';

type FacultyModuleScreenProps = {
  activeRoute?: FacultyNavRoute;
  accentColor: string;
  accentSoft: string;
  emptyDescription: string;
  emptyTitle: string;
  heroIcon: keyof typeof MaterialIcons.glyphMap;
  sectionLabel: string;
  subtitle: string;
  title: string;
};

export function FacultyModuleScreen({
  activeRoute,
  accentColor,
  accentSoft,
  emptyDescription,
  emptyTitle,
  heroIcon,
  sectionLabel,
  subtitle,
  title,
}: FacultyModuleScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: accentColor }]}>
          <View style={[styles.heroGlowLarge, { backgroundColor: accentSoft }]} />
          <View style={styles.heroGlowSmall} />

          <View style={styles.heroTopRow}>
            <View style={styles.badge}>
              <MaterialIcons name={heroIcon} size={16} color="#F7FBF9" />
              <ThemedText style={styles.badgeText}>{sectionLabel}</ThemedText>
            </View>
            <Pressable onPress={() => router.replace('/faculty-dashboard')} style={styles.dashboardButton}>
              <MaterialIcons name="dashboard" size={18} color="#F7FBF9" />
              <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
            </Pressable>
          </View>

          <View style={styles.heroIconWrap}>
            <MaterialIcons name={heroIcon} size={34} color="#F7FBF9" />
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
              <ThemedText style={styles.panelSubtitle}>A dedicated faculty screen is ready for this module.</ThemedText>
            </View>
            <View style={[styles.statusChip, { backgroundColor: accentSoft, borderColor: accentColor }]}>
              <ThemedText style={[styles.statusChipText, { color: accentColor }]}>Ready</ThemedText>
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
      <FacultyBottomNav activeRoute={activeRoute} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8F5',
  },
  content: {
    gap: 22,
    paddingHorizontal: 20,
    paddingBottom: 32,
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
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderColor: '#D6E4DC',
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
    color: '#17332A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#5A756B',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
});
