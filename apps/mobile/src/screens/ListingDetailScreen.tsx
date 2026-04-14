import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassButton } from '../components/GlassButton';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Listing } from '@trano/shared';
import { SatelliteThumb } from '../components/SatelliteThumb';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import { API_BASE_URL, COLORS, WHATSAPP_PREFILL } from '../constants';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const { user }              = useAuth();
  const { toggle, isSaved }   = useSaved();
  const insets                = useSafeAreaInsets();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/listings/${listingId}`)
      .then((r) => r.json())
      .then(setListing)
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;
  if (!listing) return <Text style={styles.error}>Tsy hita ilay lisitra</Text>;

  const waPhone = listing.whatsappContact ?? (listing.owner as any).whatsappPhone;

  const handleWhatsApp = () => {
    if (!waPhone) return;
    const msg = encodeURIComponent(WHATSAPP_PREFILL(listing.title));
    Linking.openURL(`https://wa.me/${waPhone.replace(/\D/g, '')}?text=${msg}`);
  };

  const handleFavorite = () => {
    if (!user) { navigation.navigate('Login'); return; }
    if (listing) toggle(listing);
  };

  return (
    <View style={styles.container}>
      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Satellite header */}
        <View style={styles.satellite}>
          <SatelliteThumb
            latitude={listing.latitude}
            longitude={listing.longitude}
            width={SCREEN_WIDTH}
            height={220}
            delta={0.0015}
          />
          <View style={styles.satelliteOverlay}>
            <View style={styles.satelliteTags}>
              <Text style={styles.satelliteTag}>
                {listing.listingType === 'RENT' ? 'Hofana' : 'Amidy'}
              </Text>
              <Text style={styles.satelliteTag}>{listing.propertyType}</Text>
            </View>
            <TouchableOpacity style={styles.heartButton} onPress={handleFavorite} activeOpacity={0.8}>
              <Ionicons
                name={listing && isSaved(listing.id) ? 'heart' : 'heart-outline'}
                size={20}
                color={listing && isSaved(listing.id) ? '#FF4D6D' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>
            {Number(listing.priceMga).toLocaleString('fr-MG')}
            <Text style={styles.priceSuffix}> MGA</Text>
          </Text>
          {listing.priceUsdSnapshot != null && (
            <Text style={styles.usd}>≈ ${listing.priceUsdSnapshot.toFixed(0)} USD</Text>
          )}

          <View style={styles.locationRow}>
            <Text style={styles.location}>{listing.addressFreeform}</Text>
            <Text style={styles.location}>{listing.city} · {listing.region}</Text>
          </View>

          {(listing.bedrooms != null || listing.bathrooms != null || listing.areaSqm != null) && (
            <View style={styles.statsRow}>
              {listing.bedrooms  != null && <StatPill label={`${listing.bedrooms} efitrano`} />}
              {listing.bathrooms != null && <StatPill label={`${listing.bathrooms} tambajotra`} />}
              {listing.areaSqm   != null && <StatPill label={`${listing.areaSqm} m²`} />}
            </View>
          )}

          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.ownerRow}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerInitial}>{listing.owner.name[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.ownerName}>{listing.owner.name}</Text>
              {listing.owner.isVerified && (
                <Text style={styles.verified}>✓ Voamarina</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating action area */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(0, insets.bottom - 4) }]}>
        {user && (listing.owner as any).id === user.id && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('PostListing', { listingId: listing.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={15} color={COLORS.surface} />
            <Text style={styles.editBtnText}>Hanova</Text>
          </TouchableOpacity>
        )}
        {waPhone && (
          <GlassButton
            label="Mifandraisa amin'i WhatsApp"
            onPress={handleWhatsApp}
          />
        )}
      </View>
    </View>
  );
}

function StatPill({ label }: { label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  loader:      { flex: 1 },
  error:       { textAlign: 'center', marginTop: 40, color: COLORS.textMuted },
  scroll:      { flex: 1 },

  // Satellite
  satellite:        { position: 'relative' },
  satelliteOverlay: {
    position:        'absolute',
    bottom:           10,
    left:             10,
    right:            10,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
  },
  satelliteTags: { flexDirection: 'row', gap: 6 },
  satelliteTag: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    color:           '#fff',
    fontSize:         11,
    fontWeight:      '700',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      6,
    overflow:         'hidden',
  },
  heartButton: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Body
  body:         { padding: 20 },
  title:        { fontSize: 22, fontWeight: '800', color: COLORS.text },
  price:        { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginTop: 6 },
  priceSuffix:  { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  usd:          { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  locationRow:  { marginTop: 12, gap: 2 },
  location:     { fontSize: 14, color: COLORS.textMuted },
  statsRow:     { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  statPill: {
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:       8,
    backgroundColor:   COLORS.border,
  },
  statPillText:  { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  description:   { fontSize: 15, color: COLORS.textSecondary, lineHeight: 23, marginTop: 20 },
  ownerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             12,
    marginTop:       24,
    paddingTop:      20,
    borderTopWidth:   1,
    borderTopColor: COLORS.border,
  },
  ownerAvatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: COLORS.primaryMid,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ownerInitial: { color: COLORS.surface, fontWeight: '700', fontSize: 16 },
  ownerName:    { fontSize: 15, fontWeight: '700', color: COLORS.text },
  verified:     { fontSize: 12, color: COLORS.primaryLight, marginTop: 1 },

  bottomBar: {
    position:          'absolute',
    bottom:             0,
    left:               0,
    right:              0,
    paddingHorizontal: 24,
    paddingTop:        12,
    gap:                8,
  },
  editBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:                6,
    backgroundColor:   COLORS.primaryMid,
    borderRadius:      14,
    paddingVertical:   12,
  },
  editBtnText: { color: COLORS.surface, fontWeight: '700', fontSize: 15 },
});
