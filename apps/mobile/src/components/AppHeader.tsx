import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_BAR = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0;

export function AppHeader() {
  const navigation      = useNavigation<Nav>();
  const { user }        = useAuth();
  const { openDrawer }  = useDrawer();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={openDrawer} hitSlop={8}>
        <Ionicons name="menu" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>trano</Text>
        <View style={styles.logoDot} />
      </View>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate('Login')}
        hitSlop={8}
      >
        {user ? (
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarInitial}>{user.name[0].toUpperCase()}</Text>
          </View>
        ) : (
          <Ionicons name="person-outline" size={24} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:   COLORS.surface,
    paddingTop:         STATUS_BAR + 8,
    paddingBottom:      12,
    paddingHorizontal:  16,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderBottomWidth:  1,
    borderBottomColor: COLORS.border,
  },
  iconButton:    { width: 36, alignItems: 'center' },
  logoWrap:      { flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  logoText:      { fontSize: 26, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  logoDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent, marginBottom: 5 },
  avatarBadge:   { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primaryMid, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: COLORS.surface, fontSize: 13, fontWeight: '800' },
});
