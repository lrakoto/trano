import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Listing } from '@trano/shared';
import { API_BASE_URL, COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/listings`)
      .then((r) => r.json())
      .then((res) => setListings(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Hikaroka trano..."
        placeholderTextColor={COLORS.textMuted}
      />
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
          >
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardPrice}>
              {Number(item.priceMga).toLocaleString('fr-MG')} MGA
            </Text>
            <Text style={styles.cardLocation}>{item.city} · {item.region}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.tag}>
                {item.listingType === 'RENT' ? 'Hofana' : 'Amidy'}
              </Text>
              <Text style={styles.tag}>{item.propertyType}</Text>
              {item.owner.isVerified && <Text style={styles.verified}>✓ Voamarina</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Tsy misy lisitra amin'izao fotoana izao</Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PostListing')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  loader:       { flex: 1 },
  searchBar: {
    margin: 16, padding: 12, borderRadius: 8,
    backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: COLORS.border, fontSize: 16,
  },
  list:         { paddingHorizontal: 12, paddingBottom: 80 },
  card: {
    padding: 16, marginBottom: 12, backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle:    { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardPrice:    { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  cardLocation: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  cardMeta:     { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    backgroundColor: COLORS.secondary + '22', color: COLORS.secondary, fontSize: 12,
  },
  verified:     { fontSize: 12, color: COLORS.secondary },
  empty:        { textAlign: 'center', marginTop: 60, color: COLORS.textMuted, fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  fabText:      { color: COLORS.white, fontSize: 28, lineHeight: 32 },
});
