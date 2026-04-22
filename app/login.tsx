import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { startTransition, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import {
  syncLectureNotifications,
  syncStudentUploadedNoteNotifications,
} from '@/constants/lecture-notifications';
import { saveSession } from '@/constants/session';

type LoginRole = 'student' | 'faculty';

const roleCards: {
  role: LoginRole;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  {
    role: 'student',
    title: 'Student',
    icon: 'school',
  },
  {
    role: 'faculty',
    title: 'Faculty',
    icon: 'co-present',
  },
];

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [selectedRole, setSelectedRole] = useState<LoginRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter both email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const message = data?.message || 'Login failed. Please try again.';
        setErrorMessage(message);
        Alert.alert('Login failed', message);
        return;
      }

      const session = {
        token: data.token,
        user: data.user,
      };

      await saveSession(session);

      try {
        await syncLectureNotifications(session, {
          promptForPermission: true,
        });
        await syncStudentUploadedNoteNotifications(session, {
          promptForPermission: false,
        });
      } catch (notificationError) {
        console.warn('Studify reminders could not be prepared:', notificationError);
      }

      startTransition(() => {
        router.replace(data.user?.role === 'faculty' ? '/faculty-dashboard' : '/student-dashboard');
      });
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? 'Login request timed out. Check that the backend server is running and the API URL is correct.'
          : 'Could not reach the login server. Check that the backend server is running and the API URL is correct.';
      setErrorMessage(message);
      Alert.alert('Connection error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}>
        <ScrollView
          contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          <View style={styles.headerBlock}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconWrap}>
                <MaterialIcons name="notifications-active" size={24} color="#0A2239" />
              </View>
              <View>
                <ThemedText style={styles.brandName}>Studify</ThemedText>
                <ThemedText style={styles.brandTag}>COMPUTER SCIENCE PORTAL</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.heading, isCompact && styles.headingCompact]}>Login</ThemedText>
            <ThemedText style={[styles.subheading, isCompact && styles.subheadingCompact]}>
              Computer Science portal
            </ThemedText>
          </View>

          <View style={[styles.card, isCompact && styles.cardCompact]}>
            <ThemedText style={styles.sectionTitle}>Choose your access</ThemedText>
            <View style={[styles.roleGrid, isCompact && styles.roleGridCompact]}>
              {roleCards.map((item) => {
                const active = item.role === selectedRole;

                return (
                  <Pressable
                    key={item.role}
                    onPress={() => setSelectedRole(item.role)}
                    style={[
                      styles.roleCard,
                      isCompact && styles.roleCardCompact,
                      active ? styles.roleCardActive : styles.roleCardInactive,
                    ]}>
                    <View
                      style={[
                        styles.roleIconWrap,
                        isCompact && styles.roleIconWrapCompact,
                        active && styles.roleIconWrapActive,
                      ]}>
                      <MaterialIcons
                        name={item.icon}
                        size={isCompact ? 24 : 28}
                        color={active ? '#0B2340' : '#8EE3F5'}
                      />
                    </View>
                    <ThemedText style={[styles.roleTitle, active && styles.roleTitleActive]}>
                      {item.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Email</ThemedText>
              <View style={styles.inputShell}>
                <MaterialIcons name="alternate-email" size={20} color="#8AA1B8" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={
                    selectedRole === 'student'
                      ? 'student@college.edu'
                      : 'faculty@college.edu'
                  }
                  placeholderTextColor="#6F8297"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <View style={styles.inputShell}>
                <MaterialIcons name="lock-outline" size={20} color="#8AA1B8" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#6F8297"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <Pressable
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((current) => !current)}
                  style={styles.passwordToggle}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#8AA1B8"
                  />
                </Pressable>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color="#FFD6D6" />
                <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
              </View>
            ) : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleLogin}
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}>
              <ThemedText style={styles.loginButtonText}>
                {isSubmitting
                  ? 'Logging in...'
                  : `Login as ${selectedRole === 'student' ? 'Student' : 'Faculty'}`}
              </ThemedText>
              <MaterialIcons name="arrow-forward" size={20} color="#08111C" />
            </Pressable>

            <View style={styles.footerNote}>
              <MaterialIcons name="verified-user" size={18} color="#8EE3F5" />
              <ThemedText style={styles.footerNoteText}>
                Login is securely checked through the backend API.
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08111C',
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  contentCompact: {
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  glowTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(72, 194, 255, 0.18)',
    top: -80,
    right: -70,
  },
  glowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(92, 124, 250, 0.16)',
    bottom: -70,
    left: -90,
  },
  headerBlock: {
    marginBottom: 28,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#8EE3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: '#F8FBFF',
    fontSize: 24,
    fontWeight: '800',
  },
  brandTag: {
    color: '#8EE3F5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  heading: {
    color: '#F8FBFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginBottom: 10,
  },
  headingCompact: {
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 6,
  },
  subheading: {
    color: 'rgba(248,251,255,0.72)',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 340,
  },
  subheadingCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(14, 33, 52, 0.94)',
    padding: 20,
    gap: 16,
  },
  cardCompact: {
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    color: '#F8FBFF',
    fontSize: 18,
    fontWeight: '700',
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  roleGridCompact: {
    gap: 10,
  },
  roleCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 132,
    padding: 16,
  },
  roleCardCompact: {
    borderRadius: 18,
    minHeight: 118,
    padding: 12,
  },
  roleCardActive: {
    backgroundColor: '#8EE3F5',
    borderColor: '#8EE3F5',
  },
  roleCardInactive: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  roleIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(142, 227, 245, 0.12)',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    marginBottom: 12,
    width: 76,
  },
  roleIconWrapCompact: {
    borderRadius: 14,
    height: 40,
    marginBottom: 10,
    width: 64,
  },
  roleIconWrapActive: {
    backgroundColor: 'rgba(11,35,64,0.12)',
  },
  roleTitle: {
    color: '#F8FBFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleTitleActive: {
    color: '#0B2340',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#C9D7E4',
    fontSize: 14,
    fontWeight: '600',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    color: '#F8FBFF',
    fontSize: 15,
    paddingVertical: 14,
  },
  passwordToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(176, 54, 63, 0.24)',
    borderColor: 'rgba(255, 143, 143, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: '#FFD6D6',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: '#8EE3F5',
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#08111C',
    fontSize: 16,
    fontWeight: '800',
  },
  footerNote: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  footerNoteText: {
    flex: 1,
    color: 'rgba(248,251,255,0.62)',
    fontSize: 13,
    lineHeight: 19,
  },
});
