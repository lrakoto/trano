import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Dimensions,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Listing } from '@trano/shared';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { height } = Dimensions.get('window');

// Default map center: Antananarivo
const DEFAULT_REGION = {
  latitude:      -18.9137,
  longitude:      47.5361,
  latitudeDelta:  0.5,
  longitudeDelta: 0.5,
};

export function HomeScreen() {
  const navigation  = useNavigation<Nav>();
  const { user }    = useAuth();
  const mapRef      = useRef<MapView>(null);

  const [listings,     setListings]     = useState<Listing[]>([]);
  const [filtered,     setFiltered]     = useState<Listing[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch listings from API
  useEffect(() => {
    fetch(`${API_BASE_URL}/listings`)
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? [];
        setListings(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Request location and pan map to user
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.2, longitudeDelta: 0.2 }, 800);
    })();
  }, []);

  // Filter listings by city search
  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      q
        ? listings.filter(
            (l) =>
              l.city.toLowerCase().includes(q) ||
              l.title.toLowerCase().includes(q) ||
              l.region.toLowerCase().includes(q),
          )
        : listings,
    );
  }, [search, listings]);

  const handleFab = () => {
    navigation.navigate(user ? 'PostListing' : 'Login');
  };

  return (
    <View style={styles.container}>

      {/* ── Top half: Map ─────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}
        >
          {filtered.map((listing) => (
            <Marker
              key={listing.id}
              coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
            >
              <View style={styles.pin}>
                <Text style={styles.pinText}>
                  {(Number(listing.priceMga) / 1_000_000).toFixed(1)}M
                </Text>
              </View>
              <Callout
                onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
              >
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.calloutPrice}>
                    {Number(listing.priceMga).toLocaleString('fr-MG')} MGA
                  </Text>
                  <Text style={styles.calloutCta}>Hijery →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* ── Bottom half: Listings list ─────────────────────── */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={COLORS.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardPrice}>
                    {Number(item.priceMga).toLocaleString('fr-MG')} MGA
                  </Text>
                </View>
                <Text style={styles.cardLocation}>{item.city} · {item.region}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.tag}>
                    {item.listingType === 'RENT' ? 'Hofana' : 'Amidy'}
                  </Text>
                  <Text style={styles.tag}>{item.propertyType}</Text>
                  {item.bedrooms  != null && <Text style={styles.tagMuted}>{item.bedrooms} efitrano</Text>}
                  {item.areaSqm   != null && <Text style={styles.tagMuted}>{item.areaSqm} m²</Text>}
                  {item.owner.isVerified && <Text style={styles.verified}>✓</Text>}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {search ? 'Tsy misy voahitsika' : 'Tsy misy lisitra amin\'izao fotoana izao'}
              </Text>
            }
          />
        )}
      </View>

      {/* ── Pinned search bar at bottom ────────────────────── */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Hikaroka tanàna... (ex: Antananarivo)"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── FAB: post listing (prompts login if needed) ────── */}
      <TouchableOpacity style={styles.fab} onPress={handleFab} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },

  // Map
  mapContainer: { height: height * 0.45 },
  map:          { flex: 1 },
  pin: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3,
    borderWidth: 1.5, borderColor: COLORS.white,
  },
  pinText:      { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  callout:      { width: 180, padding: 10 },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  calloutPrice: { fontSize: 12, color: COLORS.primary, marginTop: 3 },
  calloutCta:   { fontSize: 11, color: COLORS.secondary, marginTop: 5 },

  // List
  listContainer: { flex: 1, marginBottom: 62 },
  loader:        { marginTop: 30 },
  list:          { padding: 12, paddingBottom: 8 },
  card: {
    padding: 14, marginBottom: 10, backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle:    { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1, marginRight: 8 },
  cardPrice:    { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  cardLocation: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  cardMeta:     { flexDirection: 'row', gap: 5, marginTop: 7, flexWrap: 'wrap', alignItems: 'center' },
  tag: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
    backgroundColor: COLORS.secondary + '22', color: COLORS.secondary, fontSize: 11, fontWeight: '600',
  },
  tagMuted: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
    backgroundColor: COLORS.border, color: COLORS.textMuted, fontSize: 11,
  },
  verified:     { fontSize: 12, color: COLORS.secondary, fontWeight: '700' },
  empty:        { textAlign: 'center', marginTop: 40, color: COLORS.textMuted, fontSize: 14 },

  // Search bar
  searchBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 8,
  },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },

  // FAB
  fab: {
    position: 'absolute', bottom: 72, right: 16, width: 52, height: 52,
    borderRadius: 26, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  fabText: { color: COLORS.white, fontSize: 28, lineHeight: 32 },
});
