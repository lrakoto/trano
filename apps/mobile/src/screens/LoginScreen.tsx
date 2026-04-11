import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { height } = Dimensions.get('window');

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Spinning globe
  const spinValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue:         1,
        duration:        9000,
        easing:          Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Diso', 'Fenoy ny lahajan-telefaona sy ny teny miafina');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (e: any) {
      Alert.alert('Tsy voamarina', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Close button — top-right */}
      <TouchableOpacity style={styles.dismiss} onPress={() => navigation.goBack()} hitSlop={10}>
        <Ionicons name="close-circle" size={34} color={COLORS.accent} />
      </TouchableOpacity>

      <View style={styles.inner}>
        {/* Spinning globe */}
        <View style={styles.globeWrap}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="globe-outline" size={58} color={COLORS.primaryLight} />
          </Animated.View>
        </View>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>trano</Text>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.subtitle}>Midira amin'ny kaontinao</Text>

        {/* Form */}
        <Text style={styles.label}>Lahajan-telefaona</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+261 34 XX XXX XX"
          autoComplete="tel"
        />

        <Text style={styles.label}>Teny miafina</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          autoComplete="password"
        />

        <GlassButton
          label="Miditra"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity style={styles.link} onPress={() => navigation.replace('Register')}>
          <Text style={styles.linkText}>Tsy manana kaonty? <Text style={styles.linkBold}>Mamorona</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: {
    flex:              1,
    paddingHorizontal: 28,
    paddingTop:        height * 0.10,
    paddingBottom:     40,
  },

  // Globe
  globeWrap: { alignItems: 'center', marginBottom: 18 },

  // Logo
  logoWrap:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, marginBottom: 6 },
  logoText:  { fontSize: 42, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 },
  logoDot:   { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.accent, marginBottom: 8 },
  subtitle:  { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 32 },

  // Form
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.text,
  },
  button: { marginTop: 28 },
  link:     { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: COLORS.textMuted },
  linkBold: { color: COLORS.primary, fontWeight: '700' },

  // Close button
  dismiss: {
    position: 'absolute',
    top:       Platform.OS === 'ios' ? 24 : 16,
    right:     20,
    zIndex:    10,
    padding:   6,
  },
});
