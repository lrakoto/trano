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

  const handleUserPress = () => {
    navigation.navigate(user ? 'Login' : 'Login');
    // TODO: if user → navigate to full profile/settings modal
  };

  return (
    <View style={styles.container}>
      {/* Left — hamburger */}
      <TouchableOpacity style={styles.iconButton} onPress={onMenuPress} hitSlop={8}>
        <Ionicons name="menu" size={24} color={COLORS.surface} />
      </TouchableOpacity>

      {/* Center — logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>trano</Text>
        <View style={styles.logoDot} />
      </View>

      {/* Right — user */}
      <TouchableOpacity style={styles.iconButton} onPress={handleUserPress} hitSlop={8}>
        {user ? (
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarInitial}>{user.name[0].toUpperCase()}</Text>
          </View>
        ) : (
          <Ionicons name="person-circle-outline" size={26} color={COLORS.surface} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingTop:       STATUS_BAR_HEIGHT + 10,
    paddingBottom:    14,
    paddingHorizontal: 16,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
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
    fontSize:     26,
    fontWeight:   '800',
    color:        COLORS.surface,
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
    backgroundColor: COLORS.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    color:      COLORS.primary,
    fontSize:   13,
    fontWeight: '800',
  },
});
