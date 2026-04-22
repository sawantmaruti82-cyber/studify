import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type FacultyNavRoute =
  | '/faculty-attendance'
  | '/faculty-classroom'
  | '/faculty-notes'
  | '/faculty-notifications';

const navItems: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  route: FacultyNavRoute;
}[] = [
  { icon: 'fact-check', label: 'Attendance', route: '/faculty-attendance' },
  { icon: 'assignment', label: 'Classroom', route: '/faculty-classroom' },
  { icon: 'menu-book', label: 'Notes', route: '/faculty-notes' },
  { icon: 'notifications-active', label: 'Notifications', route: '/faculty-notifications' },
];

type FacultyBottomNavProps = {
  activeRoute?: FacultyNavRoute;
};

export function FacultyBottomNav({ activeRoute }: FacultyBottomNavProps) {
  return (
    <View style={styles.bottomNavShell}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = activeRoute === item.route;

          return (
            <Pressable
              key={item.label}
              onPress={() => router.replace(item.route)}
              style={styles.bottomNavItem}>
              <View
                style={[
                  styles.bottomNavIconWrap,
                  isActive && styles.bottomNavIconWrapActive,
                ]}>
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={isActive ? '#F8FBFF' : '#0E5A43'}
                />
              </View>
              <ThemedText
                style={[
                  styles.bottomNavLabel,
                  isActive && styles.bottomNavLabelActive,
                ]}>
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavShell: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 8,
  },
  bottomNav: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: '#D6E4DC',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 14,
    shadowColor: '#0E5A43',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  bottomNavIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(14,90,67,0.1)',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  bottomNavIconWrapActive: {
    backgroundColor: '#0E5A43',
  },
  bottomNavLabel: {
    color: '#60756B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomNavLabelActive: {
    color: '#0E5A43',
  },
});
