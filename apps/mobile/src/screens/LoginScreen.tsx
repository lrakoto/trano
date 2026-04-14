import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
// lottie-react-native works in production/dev builds only (not Expo Go):
// import LottieView from 'lottie-react-native';
// const globeAnim = require('../../assets/globe.json');
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { KeyboardDismissBar } from '../components/KeyboardDismissBar';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Diso', 'Fenoy ny lahajan-telefaona sy ny teny miafina');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
      navigation.goBack();
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
      <TouchableOpacity style={styles.dismiss} onPress={() => navigation.goBack()} hitSlop={10}>
        <Ionicons name="close-circle" size={34} color={COLORS.accent} />
      </TouchableOpacity>

      <View style={styles.inner}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>trano</Text>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.subtitle}>Midira amin'ny kaontinao</Text>

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
      <KeyboardDismissBar />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: {
    flex:              1,
    paddingHorizontal: 28,
    justifyContent:   'center',
    paddingBottom:     60,
  },

  logoWrap: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'center',
    gap:             1,
    marginBottom:    6,
  },
  logoText: { fontSize: 42, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 },
  logoDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 32 },

  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 14, fontSize: 15, color: COLORS.text,
  },
  button:   { marginTop: 28 },
  link:     { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: COLORS.textMuted },
  linkBold: { color: COLORS.primary, fontWeight: '700' },

  dismiss: {
    position: 'absolute',
    top:       Platform.OS === 'ios' ? 24 : 16,
    right:     20,
    zIndex:    10,
    padding:   6,
  },
});
