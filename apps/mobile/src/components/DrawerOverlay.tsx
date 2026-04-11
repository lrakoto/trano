import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Pressable, Dimensions, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../context/DrawerContext';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';

interface Props {
  navRef: NavigationContainerRef<RootStackParamList>;
}

const SCREEN_W   = Dimensions.get('window').width;
const DRAWER_W   = SCREEN_W * 0.72;
const STATUS_BAR = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 0;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MenuItem = { icon: IoniconsName; label: string; screen?: keyof RootStackParamList; accent?: boolean };

export function DrawerOverlay({ navRef }: Props) {
  const { open, closeDrawer } = useDrawer();
  const { user } = useAuth();

  const translateX = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const visible    = useRef(false);

  useEffect(() => {
    if (open && !visible.current) {
      visible.current = true;
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0,         useNativeDriver: true, damping: 22, stiffness: 180 }),
        Animated.timing(backdropOp, { toValue: 1,         useNativeDriver: true, duration: 220 }),
      ]).start();
    } else if (!open && visible.current) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -DRAWER_W, useNativeDriver: true, duration: 200 }),
        Animated.timing(backdropOp, { toValue: 0,         useNativeDriver: true, duration: 200 }),
      ]).start(() => { visible.current = false; });
    }
  }, [open]);

  const go = (screen?: keyof RootStackParamList) => {
    closeDrawer();
    if (screen) setTimeout(() => navRef.navigate(screen as any), 210);
  };

  const menuItems: MenuItem[] = [
    { icon: 'add-circle-outline',         label: 'Hanampy lisitra',       screen: user ? 'PostListing' : 'Login', accent: true },
    { icon: user ? 'person-outline' : 'log-in-outline', label: user ? user.name : 'Hiditra', screen: 'Login' },
    { icon: 'heart-outline',              label: 'Ny lisitra voatahiry' },
    { icon: 'information-circle-outline', label: 'Momba ny Trano' },
  ];

  if (!open) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOp }]}
        pointerEvents="auto"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX }] }]}
        pointerEvents="auto"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>trano</Text>
          <View style={styles.logoDot} />
        </View>
        {user && <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>}

        <View style={styles.divider} />

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => go(item.screen)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={item.accent ? COLORS.accent : 'rgba(255,255,255,0.72)'}
            />
            <Text style={[styles.menuLabel, item.accent && styles.menuLabelAccent]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position:          'absolute',
    top:                0,
    bottom:             0,
    left:               0,
    width:              DRAWER_W,
    backgroundColor:   COLORS.primary,
    paddingTop:         STATUS_BAR + 24,
    paddingHorizontal:  26,
    shadowColor:       '#000',
    shadowOpacity:      0.25,
    shadowRadius:       16,
    shadowOffset:      { width: 4, height: 0 },
    elevation:          12,
  },
  logoWrap:        { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginBottom: 2 },
  logoText:        { fontSize: 30, fontWeight: '800', color: COLORS.surface, letterSpacing: -0.5 },
  logoDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent, marginBottom: 6 },
  userName:        { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  divider:         { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 22 },
  menuItem:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  menuLabel:       { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.82)' },
  menuLabelAccent: { color: COLORS.accent, fontWeight: '700' },
});
