import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

type Role = 'BUYER' | 'SELLER' | 'AGENT';

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'BUYER',  label: 'Mividy / Manofa',   desc: 'Mitady trano' },
  { value: 'SELLER', label: 'Mpamidy / Mpamofa',  desc: 'Manolotra trano' },
  { value: 'AGENT',  label: 'Antsoera',            desc: 'Manerantany voamarina' },
];

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<Role>('BUYER');
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert('Diso', 'Fenoy ny saha rehetra voaisy *');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Diso', 'Ny teny miafina dia tokony ho litera 8 farafahakeliny');
      return;
    }
    setLoading(true);
    try {
      await register({ name, phone, password, role });
    } catch (e: any) {
      Alert.alert('Tsy vita', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Trano</Text>
        <Text style={styles.subtitle}>Mamorona kaonty vaovao</Text>

        <Text style={styles.label}>Anarana *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Anarana feno"
          autoComplete="name"
        />

        <Text style={styles.label}>Lahajan-telefaona *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+261 34 XX XXX XX"
          autoComplete="tel"
        />

        <Text style={styles.label}>Teny miafina *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8 litera farafahakeliny"
          autoComplete="new-password"
        />

        <Text style={styles.label}>Ianao dia...</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleCard, role === r.value && styles.roleCardActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                {r.label}
              </Text>
              <Text style={[styles.roleDesc, role === r.value && styles.roleDescActive]}>
                {r.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.buttonText}>Mamorona kaonty</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.replace('Login')}>
          <Text style={styles.linkText}>Manana kaonty sahady? <Text style={styles.linkBold}>Miditra</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  inner:           { padding: 28, paddingBottom: 48 },
  logo:            { fontSize: 42, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 6 },
  subtitle:        { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28 },
  label:           { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 14, fontSize: 15, color: COLORS.text,
  },
  roleRow:         { flexDirection: 'column', gap: 8, marginTop: 4 },
  roleCard: {
    padding: 14, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  roleCardActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '0D' },
  roleLabel:       { fontSize: 14, fontWeight: '700', color: COLORS.text },
  roleLabelActive: { color: COLORS.primary },
  roleDesc:        { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  roleDescActive:  { color: COLORS.primary },
  button: {
    marginTop: 28, backgroundColor: COLORS.primary,
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  link:       { marginTop: 20, alignItems: 'center' },
  linkText:   { fontSize: 14, color: COLORS.textMuted },
  linkBold:   { color: COLORS.primary, fontWeight: '700' },
});
