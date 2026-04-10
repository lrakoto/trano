import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
  Modal, Animated, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_W   = Dimensions.get('window').width;
const DRAWER_W   = SCREEN_W * 0.72;
const STATUS_BAR = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0;

type MenuItem = {
  icon:  React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  accent?: boolean;
};

export function AppHeader() {
  const navigation  = useNavigation<Nav>();
  const { user }    = useAuth();
  const [open, setOpen] = useState(false);

  const translateX  = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropOp  = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setOpen(true);
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0,       useNativeDriver: true, damping: 22, stiffness: 180 }),
      Animated.timing(backdropOp, { toValue: 1,       useNativeDriver: true, duration: 220 }),
    ]).start();
  };

  const closeDrawer = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -DRAWER_W, useNativeDriver: true, duration: 200 }),
      Animated.timing(backdropOp, { toValue: 0,         useNativeDriver: true, duration: 200 }),
    ]).start(() => { setOpen(false); cb?.(); });
  };

  const go = (screen: keyof RootStackParamList) =>
    closeDrawer(() => navigation.navigate(screen as any));

  const menuItems: MenuItem[] = [
    {
      icon:    'add-circle-outline',
      label:   'Hanampy lisitra',
      accent:  true,
      onPress: () => go(user ? 'PostListing' : 'Login'),
    },
    {
      icon:    user ? 'person-outline' : 'log-in-outline',
      label:   user ? user.name : 'Hiditra',
      onPress: () => go('Login'),
    },
    {
      icon:    'heart-outline',
      label:   'Ny lisitra voatahiry',
      onPress: () => closeDrawer(),   // Saved tab — close drawer, already on tabs
    },
    {
      icon:    'information-circle-outline',
      label:   'Momba ny Trano',
      onPress: () => closeDrawer(),
    },
  ];

  return (
    <>
      {/* ── Header bar ───────────────────────────────────── */}
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

      {/* ── Slide drawer ─────────────────────────────────── */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => closeDrawer()}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOp }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()} />
        </Animated.View>

        {/* Panel */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* Drawer header */}
          <View style={styles.drawerHeader}>
            <View style={styles.logoWrap}>
              <Text style={[styles.logoText, { color: COLORS.surface }]}>trano</Text>
              <View style={[styles.logoDot, { backgroundColor: COLORS.accent }]} />
            </View>
            {user && (
              <Text style={styles.drawerSubtitle} numberOfLines={1}>{user.name}</Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.drawerDivider} />

          {/* Items */}
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.accent ? COLORS.accent : 'rgba(255,255,255,0.75)'}
              />
              <Text style={[styles.menuLabel, item.accent && styles.menuLabelAccent]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Header
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
  iconButton: { width: 36, alignItems: 'center' },
  logoWrap:   { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  logoText:   { fontSize: 26, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  logoDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent, marginBottom: 5 },
  avatarBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primaryMid,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: COLORS.surface, fontSize: 13, fontWeight: '800' },

  // Drawer
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position:        'absolute',
    top:              0,
    bottom:           0,
    left:             0,
    width:            DRAWER_W,
    backgroundColor: COLORS.primary,
    paddingTop:       STATUS_BAR + 20,
    paddingHorizontal: 24,
    shadowColor:     '#000',
    shadowOpacity:    0.25,
    shadowRadius:    16,
    shadowOffset:    { width: 4, height: 0 },
    elevation:        12,
  },
  drawerHeader:   { marginBottom: 8 },
  drawerSubtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 },
  drawerDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 20 },

  menuItem: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             14,
    paddingVertical: 13,
  },
  menuLabel: {
    fontSize:   15,
    fontWeight: '500',
    color:      'rgba(255,255,255,0.85)',
  },
  menuLabelAccent: {
    color:      COLORS.accent,
    fontWeight: '700',
  },
});
