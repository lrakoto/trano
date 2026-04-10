import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

// TODO: show user listings, verification status, settings

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profily — ho avy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  text:      { color: COLORS.textMuted, fontSize: 16 },
});
