import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { COLORS } from '../constants';

export function SavedScreen() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.body}>
        <Ionicons name="heart-outline" size={52} color={COLORS.border} />
        <Text style={styles.title}>Trano Voatahiry</Text>
        <Text style={styles.sub}>
          Ny trano tianao dia hiseho eto.{'\n'}Tsindrio ny ♡ amin'ny lisitra mba hitahiry azy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  body:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title:     { fontSize: 20, fontWeight: '700', color: COLORS.text },
  sub:       { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});
