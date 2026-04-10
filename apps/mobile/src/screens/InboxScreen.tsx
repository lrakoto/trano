import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';
import { TouchableOpacity } from 'react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function InboxScreen() {
  const { user }   = useAuth();
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.body}>
        {user ? (
          <>
            <Ionicons name="mail-outline" size={52} color={COLORS.border} />
            <Text style={styles.title}>Hafatra</Text>
            <Text style={styles.sub}>Tsy misy hafatra mbola tonga.{'\n'}Ny resaka momba ny lisitra dia hiseho eto.</Text>
          </>
        ) : (
          <>
            <Ionicons name="lock-closed-outline" size={52} color={COLORS.border} />
            <Text style={styles.title}>Midira aloha</Text>
            <Text style={styles.sub}>Mila kaonty ianao mba hahita ny hafatrao.</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Miditra</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  body:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title:     { fontSize: 20, fontWeight: '700', color: COLORS.text },
  sub:       { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: 8, backgroundColor: COLORS.primary,
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12,
  },
  buttonText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
});
