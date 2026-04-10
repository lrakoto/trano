import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Top cities in Madagascar by real estate activity
const CITIES = [
  { name: 'Antananarivo', region: 'Analamanga',        emoji: '🏙️' },
  { name: 'Toamasina',    region: 'Atsinanana',        emoji: '🌊' },
  { name: 'Antsirabe',    region: 'Vakinankaratra',    emoji: '🌿' },
  { name: 'Fianarantsoa', region: 'Matsiatra Ambony',  emoji: '🏔️' },
  { name: 'Mahajanga',    region: 'Boeny',             emoji: '🌅' },
  { name: 'Toliara',      region: 'Atsimo-Andrefana',  emoji: '🏝️' },
  { name: 'Antsiranana',  region: 'Diana',             emoji: '⚓' },
  { name: 'Morondava',    region: 'Menabe',            emoji: '🌴' },
  { name: 'Ambatondrazaka', region: 'Alaotra-Mangoro', emoji: '🌾' },
  { name: 'Sambava',      region: 'Sava',              emoji: '☕' },
];

export function CitiesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <AppHeader />
      <Text style={styles.heading}>Tanàna Malaza</Text>
      <FlatList
        data={CITIES}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => {
              // TODO: navigate to HomeScreen filtered by this city
            }}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.info}>
              <Text style={styles.cityName}>{item.name}</Text>
              <Text style={styles.regionName}>{item.region}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heading:   { fontSize: 22, fontWeight: '800', color: COLORS.text, margin: 20, marginBottom: 12 },
  list:      { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: COLORS.surface,
    borderRadius:   14,
    padding:        16,
    marginBottom:   10,
    borderWidth:    1,
    borderColor:    COLORS.border,
    gap:            14,
  },
  emoji:      { fontSize: 28 },
  info:       { flex: 1 },
  cityName:   { fontSize: 16, fontWeight: '700', color: COLORS.text },
  regionName: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
