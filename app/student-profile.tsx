import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { getSession, SessionUser } from '@/constants/session';

export default function StudentProfileScreen() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const session = await getSession();

      if (!active) {
        return;
      }

      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handlePasswordReset = async () => {
    if (!user) {
      Alert.alert('Profile unavailable', 'Please log in again to change the password.');
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing details', 'Please fill the current, new, and confirm password fields.');
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert('Weak password', 'The new password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'The new password and confirm password must be the same.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        body: JSON.stringify({
          currentPassword,
          email: user.email,
          newPassword,
          role: user.role,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to update password right now.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your new password has been saved successfully.');
    } catch (error) {
      Alert.alert(
        'Password reset failed',
        error instanceof Error ? error.message : 'Unable to update password right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />

          <View style={styles.heroTopRow}>
            <View style={styles.badge}>
              <MaterialIcons name="person" size={16} color="#F8FBFF" />
              <ThemedText style={styles.badgeText}>Profile</ThemedText>
            </View>
            <Pressable onPress={() => router.replace('/student-dashboard')} style={styles.dashboardButton}>
              <MaterialIcons name="dashboard" size={18} color="#F8FBFF" />
              <ThemedText style={styles.dashboardButtonText}>Dashboard</ThemedText>
            </Pressable>
          </View>

          <View style={styles.avatarWrap}>
            <MaterialIcons name="person" size={42} color="#F8FBFF" />
          </View>
          <ThemedText type="title" style={styles.heroTitle}>
            {isLoading ? 'Loading profile...' : user?.fullName || 'Student'}
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            {isLoading ? 'Fetching your logged-in details.' : user?.email || 'No email available'}
          </ThemedText>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <ThemedText type="subtitle" style={styles.panelTitle}>
                Logged-in student
              </ThemedText>
              <ThemedText style={styles.panelSubtitle}>
                These details are loaded from your current saved session.
              </ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color="#4D3A8C" />
              <ThemedText style={styles.stateTitle}>Loading profile</ThemedText>
            </View>
          ) : user ? (
            <>
              <View style={styles.infoWrap}>
                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrap}>
                    <MaterialIcons name="badge" size={20} color="#4D3A8C" />
                  </View>
                  <View style={styles.infoBody}>
                    <ThemedText style={styles.infoLabel}>Full name</ThemedText>
                    <ThemedText style={styles.infoValue}>{user.fullName || 'Student'}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrap}>
                    <MaterialIcons name="alternate-email" size={20} color="#4D3A8C" />
                  </View>
                  <View style={styles.infoBody}>
                    <ThemedText style={styles.infoLabel}>Email</ThemedText>
                    <ThemedText style={styles.infoValue}>{user.email}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrap}>
                    <MaterialIcons name="verified-user" size={20} color="#4D3A8C" />
                  </View>
                  <View style={styles.infoBody}>
                    <ThemedText style={styles.infoLabel}>Role</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrap}>
                    <MaterialIcons name="apartment" size={20} color="#4D3A8C" />
                  </View>
                  <View style={styles.infoBody}>
                    <ThemedText style={styles.infoLabel}>Department</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {user.department ? user.department.replace(/-/g, ' ') : 'Computer Science'}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.securityCard}>
                <View style={styles.securityHeader}>
                  <View style={styles.securityBadge}>
                    <MaterialIcons name="lock-reset" size={20} color="#4D3A8C" />
                  </View>
                  <View style={styles.securityHeaderText}>
                    <ThemedText type="subtitle" style={styles.securityTitle}>
                      Reset password
                    </ThemedText>
                    <ThemedText style={styles.securitySubtitle}>
                      Enter your current password first, then set a new one.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Current password</ThemedText>
                  <View style={styles.inputShell}>
                    <MaterialIcons name="lock-outline" size={20} color="#8B78C2" />
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor="#8D98A5"
                      secureTextEntry={!showCurrentPassword}
                      style={styles.input}
                    />
                    <Pressable
                      accessibilityLabel={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                      onPress={() => setShowCurrentPassword((current) => !current)}
                      style={styles.passwordToggle}>
                      <MaterialIcons
                        name={showCurrentPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color="#8B78C2"
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>New password</ThemedText>
                  <View style={styles.inputShell}>
                    <MaterialIcons name="vpn-key" size={20} color="#8B78C2" />
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#8D98A5"
                      secureTextEntry={!showNewPassword}
                      style={styles.input}
                    />
                    <Pressable
                      accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
                      onPress={() => setShowNewPassword((current) => !current)}
                      style={styles.passwordToggle}>
                      <MaterialIcons
                        name={showNewPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color="#8B78C2"
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Confirm password</ThemedText>
                  <View style={styles.inputShell}>
                    <MaterialIcons name="verified-user" size={20} color="#8B78C2" />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#8D98A5"
                      secureTextEntry={!showConfirmPassword}
                      style={styles.input}
                    />
                    <Pressable
                      accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      onPress={() => setShowConfirmPassword((current) => !current)}
                      style={styles.passwordToggle}>
                      <MaterialIcons
                        name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color="#8B78C2"
                      />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  disabled={isSubmitting}
                  onPress={handlePasswordReset}
                  style={[styles.resetButton, isSubmitting && styles.resetButtonDisabled]}>
                  <ThemedText style={styles.resetButtonText}>
                    {isSubmitting ? 'Updating...' : 'Update password'}
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.stateCard}>
              <MaterialIcons name="person-off" size={34} color="#4D3A8C" />
              <ThemedText style={styles.stateTitle}>No session details found</ThemedText>
              <ThemedText style={styles.stateDescription}>
                Log in again to load the student profile information.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    gap: 22,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#4D3A8C',
    borderRadius: 28,
    marginTop: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroGlowLarge: {
    backgroundColor: '#6E58B7',
    borderRadius: 999,
    height: 220,
    position: 'absolute',
    right: -80,
    top: -40,
    width: 220,
  },
  heroGlowSmall: {
    backgroundColor: '#C7B8F3',
    borderRadius: 999,
    height: 110,
    left: -26,
    position: 'absolute',
    top: 122,
    width: 110,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 30,
    height: 74,
    justifyContent: 'center',
    marginBottom: 18,
    width: 74,
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
    marginBottom: 18,
  },
  panelTitle: {
    color: '#132238',
  },
  panelSubtitle: {
    color: '#60758A',
    marginTop: 4,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  stateTitle: {
    color: '#132238',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  stateDescription: {
    color: '#60758A',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
    textAlign: 'center',
  },
  infoWrap: {
    gap: 12,
  },
  infoCard: {
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  infoIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(77,58,140,0.1)',
    borderRadius: 16,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  infoBody: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    color: '#60758A',
    fontSize: 13,
  },
  infoValue: {
    color: '#132238',
    fontSize: 16,
    fontWeight: '800',
  },
  securityCard: {
    backgroundColor: '#F8FBFF',
    borderColor: '#D7E0EA',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
    padding: 18,
  },
  securityHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  securityBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(77,58,140,0.1)',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  securityHeaderText: {
    flex: 1,
  },
  securityTitle: {
    color: '#132238',
  },
  securitySubtitle: {
    color: '#60758A',
    marginTop: 4,
  },
  inputGroup: {
    gap: 8,
    marginTop: 12,
  },
  inputLabel: {
    color: '#60758A',
    fontSize: 13,
    fontWeight: '700',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EA',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    color: '#132238',
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  passwordToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#4D3A8C',
    borderRadius: 18,
    marginTop: 18,
    paddingVertical: 15,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#F8FBFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
