import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Dimensions,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Listing } from '@trano/shared';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { API_BASE_URL, COLORS, isInMadagascar } from '../constants';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { height } = Dimensions.get('window');

const ANTANANARIVO = {
  latitude:       -18.9137,
  longitude:       47.5361,
  latitudeDelta:   0.35,
  longitudeDelta:  0.35,
};

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user }   = useAuth();
  const mapRef     = useRef<MapView>(null);

  const [listings,     setListings]     = useState<Listing[]>([]);
  const [filtered,     setFiltered]     = useState<Listing[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      // Only use device location if it's actually within Madagascar
      if (!isInMadagascar(latitude, longitude)) return;

      setUserLocation({ latitude, longitude });
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.2, longitudeDelta: 0.2 },
        800,
      );
    })();
  }, []);

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

  const handleFab = () => navigation.navigate(user ? 'PostListing' : 'Login');

  return (
    <View style={styles.container}>
      <AppHeader />

      {/* ── Map (top ~45% of remaining space) ──────────────── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={ANTANANARIVO}
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
              <Callout onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}>
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

      {/* ── Listing cards ───────────────────────────────────── */}
      <View style={styles.listWrapper}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={COLORS.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <ListingCard listing={item} onPress={() =>
              navigation.navigate('ListingDetail', { listingId: item.id })
            } />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={36} color={COLORS.border} />
                <Text style={styles.emptyText}>
                  {search ? 'Tsy misy voahitsika' : 'Tsy misy lisitra amin\'izao fotoana izao'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Pinned search bar ───────────────────────────────── */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={COLORS.textMuted} style={styles.searchIcon} />
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

      {/* ── FAB ─────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.fab} onPress={handleFab} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={COLORS.surface} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.8}>
      {/* Image placeholder — replaced with real images once upload is built */}
      <View style={card.imagePlaceholder}>
        <Ionicons name="home-outline" size={28} color={COLORS.border} />
        <View style={card.typeBadge}>
          <Text style={card.typeBadgeText}>
            {listing.listingType === 'RENT' ? 'Hofana' : 'Amidy'}
          </Text>
        </View>
      </View>

      <View style={card.body}>
        <View style={card.priceRow}>
          <Text style={card.price}>
            {Number(listing.priceMga).toLocaleString('fr-MG')}
            <Text style={card.priceCurrency}> MGA</Text>
          </Text>
          {listing.owner.isVerified && (
            <View style={card.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.primaryLight} />
            </View>
          )}
        </View>

        <Text style={card.title} numberOfLines={1}>{listing.title}</Text>

        <View style={card.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
          <Text style={card.location}>{listing.city} · {listing.region}</Text>
        </View>

        {(listing.bedrooms != null || listing.bathrooms != null || listing.areaSqm != null) && (
          <View style={card.statsRow}>
            {listing.bedrooms  != null && <Stat icon="bed-outline"    value={`${listing.bedrooms} efitrano`} />}
            {listing.bathrooms != null && <Stat icon="water-outline"  value={`${listing.bathrooms} tambajotra`} />}
            {listing.areaSqm   != null && <Stat icon="resize-outline" value={`${listing.areaSqm} m²`} />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Stat({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={statStyles.row}>
      <Ionicons name={icon} size={12} color={COLORS.textSecondary} />
      <Text style={statStyles.text}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { height: height * 0.38 },
  map:          { flex: 1 },

  pin: {
    backgroundColor: COLORS.primary,
    borderRadius:    10,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:     1.5,
    borderColor:     COLORS.surface,
    shadowColor:     '#000',
    shadowOpacity:   0.25,
    shadowRadius:    4,
    elevation:       4,
  },
  pinText: { color: COLORS.surface, fontSize: 11, fontWeight: '800' },

  callout:      { width: 190, padding: 10 },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  calloutPrice: { fontSize: 12, color: COLORS.primaryMid, marginTop: 3 },
  calloutCta:   { fontSize: 11, color: COLORS.primaryLight, marginTop: 5, fontWeight: '600' },

  listWrapper:  { flex: 1, marginBottom: 62 },
  loader:       { marginTop: 30 },
  list:         { padding: 14, paddingBottom: 8 },
  emptyWrap:    { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText:    { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },

  searchBar: {
    position:          'absolute',
    bottom:             0,
    left:               0,
    right:              0,
    backgroundColor:   COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical:    10,
    borderTopWidth:     1,
    borderTopColor:    COLORS.border,
    flexDirection:     'row',
    alignItems:        'center',
    shadowColor:       '#000',
    shadowOpacity:      0.05,
    shadowRadius:       6,
    elevation:          8,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: {
    flex:              1,
    backgroundColor:  COLORS.background,
    borderRadius:      10,
    paddingHorizontal: 12,
    paddingVertical:    9,
    fontSize:          14,
    color:            COLORS.text,
    borderWidth:       1,
    borderColor:      COLORS.border,
  },

  fab: {
    position:        'absolute',
    bottom:           72,
    right:            16,
    width:            52,
    height:           52,
    borderRadius:     26,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOpacity:    0.25,
    shadowRadius:     8,
    elevation:        6,
  },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius:    16,
    marginBottom:    12,
    overflow:        'hidden',
    borderWidth:      1,
    borderColor:     COLORS.border,
    shadowColor:     '#000',
    shadowOpacity:    0.06,
    shadowRadius:     8,
    shadowOffset:    { width: 0, height: 2 },
    elevation:        3,
  },
  imagePlaceholder: {
    height:          130,
    backgroundColor: COLORS.divider,
    alignItems:      'center',
    justifyContent:  'center',
  },
  typeBadge: {
    position:        'absolute',
    top:              10,
    left:             10,
    backgroundColor: COLORS.primary,
    borderRadius:     6,
    paddingHorizontal: 9,
    paddingVertical:   4,
  },
  typeBadgeText:    { color: COLORS.surface, fontSize: 11, fontWeight: '700' },
  body:             { padding: 14 },
  priceRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:            { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  priceCurrency:    { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  verifiedBadge:    { padding: 2 },
  title:            { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  locationRow:      { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  location:         { fontSize: 12, color: COLORS.textMuted },
  statsRow:         { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' },
});

const statStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 12, color: COLORS.textSecondary },
});
