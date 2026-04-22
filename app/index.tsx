import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { getSession } from '@/constants/session';

const { width } = Dimensions.get('window');

export default function IntroScreen() {
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-14);
  const ringScale = useSharedValue(0.7);
  const ringOpacity = useSharedValue(0.15);
  const pulseScale = useSharedValue(0.9);
  const orbitRotation = useSharedValue(0);
  const glowShift = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 13, stiffness: 140 });
    logoRotate.value = withSpring(0, { damping: 15, stiffness: 120 });

    ringOpacity.value = withSequence(
      withTiming(0.55, { duration: 800 }),
      withTiming(0.28, { duration: 700 })
    );
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.92, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.92, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    orbitRotation.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false
    );

    glowShift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    let active = true;

    const redirectAfterIntro = async () => {
      const session = await getSession();

      if (!active) {
        return;
      }

      if (session?.user?.role === 'faculty') {
        router.replace('/faculty-dashboard');
        return;
      }

      if (session?.user?.role === 'student') {
        router.replace('/student-dashboard');
        return;
      }

      router.replace('/login');
    };

    const timer = setTimeout(() => {
      void redirectAfterIntro();
    }, 3200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [glowShift, logoOpacity, logoRotate, logoScale, orbitRotation, pulseScale, ringOpacity, ringScale]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const orbitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const topGlowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: glowShift.value * 20 },
      { translateY: glowShift.value * -14 },
      { scale: 1 + glowShift.value * 0.08 },
    ],
  }));

  const bottomGlowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: glowShift.value * -18 },
      { translateY: glowShift.value * 18 },
      { scale: 1 - glowShift.value * 0.06 },
    ],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <Animated.View style={[styles.glow, styles.glowTop, topGlowAnimatedStyle]} />
        <Animated.View style={[styles.glow, styles.glowBottom, bottomGlowAnimatedStyle]} />
        <View style={styles.grid} />

        <View style={styles.centerWrap}>
          <Animated.View style={[styles.orbitRing, ringAnimatedStyle]} />
          <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />

          <Animated.View style={[styles.orbitLayer, orbitAnimatedStyle]}>
            <View style={[styles.orbitDot, styles.orbitDotOne]} />
            <View style={[styles.orbitDot, styles.orbitDotTwo]} />
            <View style={[styles.orbitDot, styles.orbitDotThree]} />
          </Animated.View>

          <Animated.View style={[styles.logoCard, logoAnimatedStyle]}>
            <View style={styles.logoCore}>
              <MaterialIcons name="school" size={42} color="#F8FBFF" />
            </View>
            <View style={styles.logoBadge}>
              <MaterialIcons name="notifications-active" size={16} color="#16395D" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(700)}>
            <ThemedText style={styles.brandEyebrow}>EDUCATION CONNECT</ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(450).duration(800)}>
            <ThemedText style={styles.brandTitle}>Studify</ThemedText>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(900).duration(800)}>
            <ThemedText style={styles.brandSubtitle}>
              Smart communication for students, faculty, and HODs.
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(1200).duration(900)} style={styles.footer}>
          <View style={styles.loadingTrack}>
            <Animated.View entering={FadeIn.delay(1400).duration(300)} style={styles.loadingBar} />
          </View>
          <ThemedText style={styles.footerText}>Preparing secure campus login...</ThemedText>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08111C',
  },
  container: {
    flex: 1,
    backgroundColor: '#08111C',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowTop: {
    width: width * 0.85,
    height: width * 0.85,
    backgroundColor: 'rgba(72, 194, 255, 0.18)',
    top: -110,
    right: -120,
  },
  glowBottom: {
    width: width * 0.95,
    height: width * 0.95,
    backgroundColor: 'rgba(82, 118, 255, 0.16)',
    bottom: -180,
    left: -120,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    transform: [{ scale: 1.08 }],
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  orbitRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(142, 227, 245, 0.35)',
  },
  pulseRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(122, 215, 240, 0.15)',
  },
  orbitLayer: {
    position: 'absolute',
    width: 270,
    height: 270,
  },
  orbitDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbitDotOne: {
    width: 14,
    height: 14,
    top: 10,
    left: 126,
    backgroundColor: '#7AD7F0',
  },
  orbitDotTwo: {
    width: 10,
    height: 10,
    bottom: 26,
    left: 30,
    backgroundColor: '#F8FBFF',
  },
  orbitDotThree: {
    width: 18,
    height: 18,
    right: 20,
    top: 120,
    backgroundColor: '#5C7CFA',
  },
  logoCard: {
    width: 128,
    height: 128,
    borderRadius: 36,
    backgroundColor: '#113B63',
    borderWidth: 1,
    borderColor: 'rgba(248,251,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7AD7F0',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    marginBottom: 32,
  },
  logoCore: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: '#1A5887',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    position: 'absolute',
    right: -6,
    top: -8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8EE3F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#08111C',
  },
  brandEyebrow: {
    color: '#8EE3F5',
    letterSpacing: 2.4,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandTitle: {
    color: '#F8FBFF',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  brandSubtitle: {
    color: 'rgba(248,251,255,0.74)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 34,
  },
  loadingTrack: {
    width: 148,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  loadingBar: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#8EE3F5',
  },
  footerText: {
    color: 'rgba(248,251,255,0.62)',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
