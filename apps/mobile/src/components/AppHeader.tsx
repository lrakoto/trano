import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  onMenuPress?: () => void;
}

export function AppHeader({ onMenuPress }: Props) {
  const navigation = useNavigation<Nav>();
  const { user }   = useAuth();

  return (
    <View style={styles.container}>
      {/* Left — hamburger */}
      <TouchableOpacity style={styles.iconButton} onPress={onMenuPress} hitSlop={8}>
        <Ionicons name="menu" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Center — logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>trano</Text>
        <View style={styles.logoDot} />
      </View>

      {/* Right — user */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate(user ? 'Login' : 'Login')}
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

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0;

const styles = StyleSheet.create({
  container: {
    backgroundColor:   COLORS.surface,
    paddingTop:         STATUS_BAR_HEIGHT + 8,
    paddingBottom:      12,
    paddingHorizontal:  16,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderBottomWidth:  1,
    borderBottomColor: COLORS.border,
  },
  iconButton: {
    width: 36,
    alignItems: 'center',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           3,
  },
  logoText: {
    fontSize:      26,
    fontWeight:    '800',
    color:         COLORS.primary,
    letterSpacing: -0.5,
  },
  logoDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: COLORS.accent,
    marginBottom:    5,
  },
  avatarBadge: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: COLORS.primaryMid,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    color:      COLORS.surface,
    fontSize:   13,
    fontWeight: '800',
  },
});
