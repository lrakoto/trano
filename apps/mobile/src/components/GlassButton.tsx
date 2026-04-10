import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, StyleProp, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

interface Props {
  label:    string;
  onPress:  () => void;
  loading?: boolean;
  /** Set true when the button sits on a dark background — inverts glass tint and text */
  dark?:    boolean;
  style?:   StyleProp<ViewStyle>;
}

export function GlassButton({ label, onPress, loading, dark = false, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      disabled={!!loading}
      style={[dark ? styles.shadowDark : styles.shadowLight, style]}
    >
      <LinearGradient
        colors={dark
          ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.06)']
          : ['rgba(255,255,255,0.93)', 'rgba(228,228,228,0.84)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.pill, { borderColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)' }]}
      >
        {/* Top gloss sheen */}
        <LinearGradient
          colors={dark
            ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']
            : ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gloss}
        />
        {loading
          ? <ActivityIndicator color={dark ? 'rgba(255,255,255,0.9)' : COLORS.primary} />
          : <Text style={[styles.label, { color: dark ? 'rgba(255,255,255,0.95)' : COLORS.primary }]}>
              {label}
            </Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const pill = {
  borderRadius:    999,
  overflow:        'hidden' as const,
  paddingVertical:  17,
  alignItems:      'center' as const,
  justifyContent:  'center' as const,
  borderWidth:      1,
};

const styles = StyleSheet.create({
  shadowLight: {
    borderRadius:  999,
    shadowColor:   '#000',
    shadowOpacity:  0.13,
    shadowRadius:   14,
    shadowOffset:  { width: 0, height: 5 },
    elevation:      6,
  },
  shadowDark: {
    borderRadius:  999,
    shadowColor:   '#000',
    shadowOpacity:  0.32,
    shadowRadius:   16,
    shadowOffset:  { width: 0, height: 6 },
    elevation:      8,
  },
  pill,
  gloss: {
    position: 'absolute',
    top:       0,
    left:      0,
    right:     0,
    height:   '50%',
    borderTopLeftRadius:  999,
    borderTopRightRadius: 999,
  },
  label: {
    fontSize:      16,
    fontWeight:   '800',
    letterSpacing:  0.3,
  },
});
