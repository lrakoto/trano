import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import type { AuthStackParamList } from '../navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

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
      <View style={styles.inner}>
        <Text style={styles.logo}>Trano</Text>
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

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.buttonText}>Miditra</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Tsy manana kaonty? <Text style={styles.linkBold}>Mamorona</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner:     { flex: 1, padding: 28, justifyContent: 'center' },
  logo:      { fontSize: 42, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 6 },
  subtitle:  { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 36 },
  label:     { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 14, fontSize: 15, color: COLORS.text,
  },
  button: {
    marginTop: 28, backgroundColor: COLORS.primary,
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  link:       { marginTop: 20, alignItems: 'center' },
  linkText:   { fontSize: 14, color: COLORS.textMuted },
  linkBold:   { color: COLORS.primary, fontWeight: '700' },
});
