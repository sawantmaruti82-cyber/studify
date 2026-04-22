import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type StudentNavRoute =
  | '/student-attendance'
  | '/student-assignments'
  | '/student-notes'
  | '/student-notifications';

const navItems: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  route: StudentNavRoute;
}[] = [
  { icon: 'fact-check', label: 'Attendance', route: '/student-attendance' },
  { icon: 'assignment', label: 'Classroom', route: '/student-assignments' },
  { icon: 'menu-book', label: 'Notes', route: '/student-notes' },
  { icon: 'notifications-active', label: 'Notifications', route: '/student-notifications' },
];

type StudentBottomNavProps = {
  activeRoute?: StudentNavRoute;
};

export function StudentBottomNav({ activeRoute }: StudentBottomNavProps) {
  return (
    <View style={styles.bottomNavShell}>
      <View style={styles.bottomNav}>
        {navItems.map((item, index) => {
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
                  color={isActive ? '#F8FBFF' : '#113B63'}
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
    borderColor: '#D7E0EA',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 14,
    shadowColor: '#113B63',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
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
    backgroundColor: 'rgba(17,59,99,0.1)',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  bottomNavIconWrapActive: {
    backgroundColor: '#113B63',
  },
  bottomNavLabel: {
    color: '#60758A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomNavLabelActive: {
    color: '#113B63',
  },
});
