import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<Nav>();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.prompt}>Midira mba hijery ny profily</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Miditra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Tsy manana kaonty? <Text style={styles.linkBold}>Mamorona</Text></Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        <View style={styles.row}>
          <Text style={styles.role}>{user.role}</Text>
          {user.isVerified && <Text style={styles.verified}>✓ Voamarina</Text>}
        </View>
      </View>

      {/* TODO: user's own listings */}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Hiala</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, padding: 20,
  },
  name:         { fontSize: 22, fontWeight: '700', color: COLORS.text },
  phone:        { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  role: {
    fontSize: 13, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    backgroundColor: COLORS.secondary + '22', color: COLORS.secondary,
  },
  verified:     { fontSize: 13, color: COLORS.secondary },
  logoutButton: {
    marginTop: 'auto', padding: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.danger, alignItems: 'center',
  },
  logoutText:   { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
  // Logged-out state
  prompt:       { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginTop: 60, marginBottom: 24 },
  button: {
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center',
  },
  buttonText:   { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  link:         { marginTop: 16, alignItems: 'center' },
  linkText:     { fontSize: 14, color: COLORS.textMuted },
  linkBold:     { color: COLORS.primary, fontWeight: '700' },
});
