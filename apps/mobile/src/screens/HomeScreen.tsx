import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Dimensions, Keyboard, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Listing } from '@trano/shared';
import { AppHeader } from '../components/AppHeader';
import { SatelliteThumb } from '../components/SatelliteThumb';
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
  const insets     = useSafeAreaInsets();
  const mapRef     = useRef<MapView>(null);
  const TAB_BAR_H  = 38 + insets.bottom;

  const [listings,     setListings]     = useState<Listing[]>([]);
  const [filtered,     setFiltered]     = useState<Listing[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [kbHeight,     setKbHeight]     = useState(0);

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
      if (!isInMadagascar(latitude, longitude)) return;
      setUserLocation({ latitude, longitude });
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.2, longitudeDelta: 0.2 },
        800,
      );
    })();
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKbHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbHeight(0),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      q ? listings.filter((l) =>
        l.city.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q),
      ) : listings,
    );
  }, [search, listings]);

  return (
    <View style={styles.container}>
      <AppHeader />

      {/* ── Map ───────────────────────────────────────────── */}
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

      {/* ── Listings ──────────────────────────────────────── */}
      <View style={styles.listWrapper}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={COLORS.primaryMid} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ListingCard
                listing={item}
                onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={32} color={COLORS.border} />
                <Text style={styles.emptyText}>
                  {search ? 'Tsy misy voahitsika' : 'Tsy misy lisitra amin\'izao fotoana izao'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Search bar ────────────────────────────────────── */}
      <View style={[styles.searchBar, { bottom: kbHeight > 0 ? kbHeight - TAB_BAR_H : 0 }]}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={15} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Hikaroka tanàna..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

    </View>
  );
}

// ─── Horizontal listing card ──────────────────────────────────────────────────

function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.8}>
      {/* Square satellite thumbnail */}
      <View style={card.image}>
        <SatelliteThumb
          latitude={listing.latitude}
          longitude={listing.longitude}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          delta={0.001}
        />
        <View style={card.typePill}>
          <Text style={card.typePillText}>
            {listing.listingType === 'RENT' ? 'Hofana' : 'Amidy'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={card.info}>
        <Text style={card.price}>
          {Number(listing.priceMga).toLocaleString('fr-MG')}
          <Text style={card.priceSuffix}> MGA</Text>
        </Text>

        <Text style={card.title} numberOfLines={1}>{listing.title}</Text>

        <View style={card.locationRow}>
          <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
          <Text style={card.location} numberOfLines={1}>
            {listing.city} · {listing.region}
          </Text>
        </View>

        <View style={card.statsRow}>
          {listing.bedrooms  != null && <StatChip icon="bed-outline"    label={`${listing.bedrooms}`} />}
          {listing.bathrooms != null && <StatChip icon="water-outline"  label={`${listing.bathrooms}`} />}
          {listing.areaSqm   != null && <StatChip icon="resize-outline" label={`${listing.areaSqm}m²`} />}
          {listing.owner.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={COLORS.primaryLight} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatChip({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={chip.row}>
      <Ionicons name={icon} size={11} color={COLORS.textSecondary} />
      <Text style={chip.label}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { height: height * 0.35 },
  map:          { flex: 1 },

  pin: {
    backgroundColor:   COLORS.primary,
    borderRadius:       10,
    paddingHorizontal:  8,
    paddingVertical:    4,
    borderWidth:        1.5,
    borderColor:       COLORS.surface,
    shadowColor:       '#000',
    shadowOpacity:      0.2,
    shadowRadius:       4,
    elevation:          4,
  },
  pinText: { color: COLORS.surface, fontSize: 11, fontWeight: '800' },

  callout:      { width: 190, padding: 10 },
  calloutTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  calloutPrice: { fontSize: 12, color: COLORS.primaryMid, marginTop: 3 },
  calloutCta:   { fontSize: 11, color: COLORS.primaryLight, marginTop: 5, fontWeight: '600' },

  listWrapper:  { flex: 1, marginBottom: 54, backgroundColor: COLORS.background },
  loader:       { marginTop: 30 },
  list:         { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  emptyWrap:    { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyText:    { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },

  searchBar: {
    position:          'absolute',
    bottom:             0,
    left:               0,
    right:              0,
    backgroundColor:   COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical:    9,
    borderTopWidth:     1,
    borderTopColor:    COLORS.border,
  },
  searchInputWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:  COLORS.background,
    borderRadius:      10,
    paddingHorizontal: 12,
    paddingVertical:    9,
    borderWidth:        1,
    borderColor:       COLORS.border,
  },
  searchInput: {
    flex:     1,
    fontSize: 14,
    color:    COLORS.text,
    padding:  0,
  },

});

const IMAGE_SIZE = 88;

const card = StyleSheet.create({
  container: {
    flexDirection:   'row',
    backgroundColor: COLORS.surface,
    borderRadius:    14,
    marginBottom:     9,
    overflow:        'hidden',
    borderWidth:      1,
    borderColor:     COLORS.border,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 1 },
    elevation:        2,
  },
  image: {
    width:           IMAGE_SIZE,
    height:          IMAGE_SIZE,
    backgroundColor: COLORS.divider,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:       0,
  },
  typePill: {
    position:          'absolute',
    bottom:             6,
    left:               6,
    backgroundColor:   COLORS.primary,
    borderRadius:       5,
    paddingHorizontal:  5,
    paddingVertical:    2,
  },
  typePillText:  { color: COLORS.surface, fontSize: 9, fontWeight: '700' },
  info: {
    flex:              1,
    paddingHorizontal: 11,
    paddingVertical:    10,
    justifyContent:    'space-between',
  },
  price:         { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  priceSuffix:   { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  title:         { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 1 },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location:      { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  statsRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
});

const chip = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontSize: 11, color: COLORS.textSecondary },
});
