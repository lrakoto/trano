import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, ActivityIndicator, Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Listing } from '@trano/shared';
import { SatelliteThumb } from '../components/SatelliteThumb';
import { API_BASE_URL, COLORS, WHATSAPP_PREFILL } from '../constants';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

export function ListingDetailScreen({ route }: Props) {
  const { listingId } = route.params;
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

  const handleWhatsApp = () => {
    const phone = listing.whatsappContact ?? (listing.owner as any).whatsappPhone;
    if (!phone) return;
    const msg = encodeURIComponent(WHATSAPP_PREFILL(listing.title));
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`);
  };

  const waPhone = listing.whatsappContact ?? (listing.owner as any).whatsappPhone;

  return (
    <ScrollView style={styles.container}>
      {/* Full-width satellite header */}
      <View style={styles.satellite}>
        <SatelliteThumb
          latitude={listing.latitude}
          longitude={listing.longitude}
          width={Dimensions.get('window').width}
          height={220}
          delta={0.003}
        />
        <View style={styles.satelliteOverlay}>
          <Text style={styles.satelliteTag}>
            {listing.listingType === 'RENT' ? 'Hofana' : 'Amidy'}
          </Text>
          <Text style={styles.satelliteTag}>{listing.propertyType}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.tagRow}>
          <Text style={styles.tag}>{listing.listingType === 'RENT' ? 'Hofana' : 'Amidy'}</Text>
          <Text style={styles.tag}>{listing.propertyType}</Text>
        </View>

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>{Number(listing.priceMga).toLocaleString('fr-MG')} MGA</Text>
        {listing.priceUsdSnapshot != null && (
          <Text style={styles.usd}>≈ ${listing.priceUsdSnapshot.toFixed(0)} USD</Text>
        )}

        <Text style={styles.location}>{listing.addressFreeform}</Text>
        <Text style={styles.location}>{listing.city} · {listing.region}</Text>

        <View style={styles.statsRow}>
          {listing.bedrooms  != null && <Text style={styles.stat}>{listing.bedrooms} efitrano</Text>}
          {listing.bathrooms != null && <Text style={styles.stat}>{listing.bathrooms} tambajotra</Text>}
          {listing.areaSqm   != null && <Text style={styles.stat}>{listing.areaSqm} m²</Text>}
        </View>

        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.ownerRow}>
          <Text style={styles.ownerName}>{listing.owner.name}</Text>
          {listing.owner.isVerified && <Text style={styles.verified}>✓ Voamarina</Text>}
        </View>
      </View>

      {waPhone ? (
        <TouchableOpacity style={styles.waButton} onPress={handleWhatsApp}>
          <Text style={styles.waButtonText}>Mifandraisa amin'i WhatsApp</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  loader:      { flex: 1 },
  error:       { textAlign: 'center', marginTop: 40, color: COLORS.textMuted },

  // Satellite header
  satellite:        { position: 'relative' },
  satelliteOverlay: {
    position:    'absolute',
    bottom:       10,
    left:         10,
    flexDirection: 'row',
    gap:           6,
  },
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

  body:        { padding: 20 },
  tagRow:      { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    backgroundColor: COLORS.primaryLight + '22', color: COLORS.primaryLight, fontSize: 12,
  },
  title:       { fontSize: 22, fontWeight: '700', color: COLORS.text },
  price:       { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  usd:         { fontSize: 13, color: COLORS.textMuted },
  location:    { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  statsRow:    { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  stat: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.border, color: COLORS.text, fontSize: 13,
  },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginTop: 16 },
  ownerRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
  ownerName:   { fontSize: 15, fontWeight: '600', color: COLORS.text },
  verified:    { fontSize: 13, color: COLORS.primaryLight },
  waButton: {
    marginHorizontal: 20, marginTop: 8, padding: 16,
    borderRadius: 12, backgroundColor: COLORS.whatsapp, alignItems: 'center',
  },
  waButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
});
