import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, ActivityIndicator, Dimensions, Image, FlatList, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

const SCREEN_WIDTH  = Dimensions.get('window').width;
const GALLERY_HEIGHT = 240;

type ListingDetail = Listing & { owner: Listing['owner'] & { whatsappPhone?: string } };

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId } = route.params;
  const { user, token }       = useAuth();
  const { toggle, isSaved }   = useSaved();
  const insets                = useSafeAreaInsets();
  const [listing,      setListing]      = useState<ListingDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [activeImg,    setActiveImg]    = useState(0);
  const [loadError,    setLoadError]    = useState(false);
  const [reportedKey,  setReportedKey]  = useState<string | undefined>(undefined);
  const [updating,     setUpdating]     = useState(false);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems[0]) setActiveImg(viewableItems[0].index ?? 0);
  }).current;

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    setActiveImg(0);
    fetch(`${API_BASE_URL}/listings/${listingId}`, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error('Could not load listing');
        return r.json() as Promise<ListingDetail>;
      })
      .then((data) => { if (!controller.signal.aborted) setListing(data); })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [listingId, token]));

  if (loading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;
  if (loadError) return <Text style={styles.error}>Tsy afaka naka ny lisitra. Andramo indray.</Text>;
  if (!listing) return <Text style={styles.error}>Tsy hita ilay lisitra</Text>;

  const isOwner = user?.id === listing.owner.id;
  const isPublic = listing.status === 'ACTIVE';
  const reportKey = `${user?.id}:${listing.id}:${listing.updatedAt}`;
  const reported = reportedKey === reportKey;
  const waPhone = listing.whatsappContact ?? listing.owner.whatsappPhone;

  const handleWhatsApp = () => {
    if (!waPhone) return;
    const msg = encodeURIComponent(WHATSAPP_PREFILL(listing.title));
    Linking.openURL(`https://wa.me/${waPhone.replace(/\D/g, '')}?text=${msg}`)
      .catch(() => Alert.alert('Diso', 'Tsy afaka nanokatra WhatsApp.'));
  };

  const handleFavorite = () => {
    if (!user) { navigation.navigate('Login'); return; }
    if (listing) toggle(listing);
  };

  const sendReport = async (reason: string) => {
    setUpdating(true);
    try {
      const result = await fetch(`${API_BASE_URL}/listings/${listingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (result.status === 409) {
        setReportedKey(reportKey);
        Alert.alert('Efa nalefa', 'Efa nanao tatitra momba ity lisitra ity ianao.');
        return;
      }
      if (!result.ok) throw new Error('Could not report listing');
      setReportedKey(reportKey);
      Alert.alert('Voaray ny tatitra', 'Hojerenay ity lisitra ity.');
    } catch {
      Alert.alert('Diso', 'Tsy afaka nandefa ny tatitra. Andramo indray.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReport = () => {
    if (!token) { navigation.navigate('Login'); return; }
    Alert.alert('Hitatitra ity lisitra ity', 'Inona no antony?', [
      { text: 'Fisolokiana', onPress: () => sendReport('Fisolokiana') },
      { text: 'Votoaty tsy mendrika', onPress: () => sendReport('Votoaty tsy mendrika') },
      { text: 'Hanafoana', style: 'cancel' },
    ]);
  };

  const handleBlock = () => {
    if (!token) { navigation.navigate('Login'); return; }
    Alert.alert('Hanakana ity mpampiasa ity?', 'Hafenina aminao ny lisitra rehetra navoakany.', [
      { text: 'Hanafoana', style: 'cancel' },
      {
        text: 'Hanakana',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            const result = await fetch(`${API_BASE_URL}/listings/${listingId}/block-owner`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!result.ok) throw new Error('Could not block user');
            navigation.goBack();
          } catch {
            Alert.alert('Diso', 'Tsy afaka nanakana ity mpampiasa ity. Andramo indray.');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Photo gallery or satellite fallback ─────────────── */}
        <View style={styles.satellite}>
          {listing.images.length > 0 ? (
            <>
              <FlatList
                data={listing.images}
                keyExtractor={(img) => img.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: SCREEN_WIDTH, height: GALLERY_HEIGHT }}
                    resizeMode="cover"
                  />
                )}
              />
              {/* Dot indicators */}
              {listing.images.length > 1 && (
                <View style={styles.dots}>
                  {listing.images.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === activeImg && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <SatelliteThumb
              latitude={listing.latitude}
              longitude={listing.longitude}
              width={SCREEN_WIDTH}
              height={GALLERY_HEIGHT}
              delta={0.0015}
            />
          )}
          <View style={styles.satelliteOverlay}>
            <View style={styles.satelliteTags}>
              <Text style={styles.satelliteTag}>
                {listing.listingType === 'RENT' ? 'Hofana' : 'Amidy'}
              </Text>
              <Text style={styles.satelliteTag}>{listing.propertyType}</Text>
            </View>
            {isPublic && (
              <TouchableOpacity style={styles.heartButton} onPress={handleFavorite} activeOpacity={0.8}>
                <Ionicons
                  name={user && isSaved(listing.id) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={user && isSaved(listing.id) ? '#FF4D6D' : '#fff'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{listing.title}</Text>
          {isOwner && !isPublic && (
            <Text style={styles.reviewStatus}>
              {listing.status === 'UNDER_REVIEW' ? 'Mbola tsy navoaka' : 'Tsy mavitrika'}
            </Text>
          )}
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
          {!isOwner && isPublic && (
            <View style={styles.safetyActions}>
              <TouchableOpacity accessibilityRole="button" onPress={handleReport} disabled={updating || reported}>
                <Text style={styles.safetyText}>{reported ? 'Voaray ny tatitra' : 'Hitatitra'}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={handleBlock} disabled={updating}>
                <Text style={styles.safetyText}>Hanakana ny mpampiasa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating action area */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(0, insets.bottom - 4) }]}>
        {isOwner && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('PostListing', { listingId: listing.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={15} color={COLORS.surface} />
            <Text style={styles.editBtnText}>Hanova</Text>
          </TouchableOpacity>
        )}
        {isPublic && waPhone && (
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

  // Gallery / satellite
  satellite:        { position: 'relative' },
  dots: {
    position:       'absolute',
    bottom:          48,
    left:             0,
    right:            0,
    flexDirection:  'row',
    justifyContent: 'center',
    gap:              5,
  },
  dot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: '#fff', width: 18 },
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
  reviewStatus: { color: COLORS.textSecondary, marginTop: 6, fontWeight: '600' },
  safetyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  safetyText: { color: COLORS.primary, paddingVertical: 12, fontWeight: '600' },
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
