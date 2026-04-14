import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { SatelliteThumb } from '../components/SatelliteThumb';
import { API_BASE_URL, COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';
import type { Listing } from '@trano/shared';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMAGE_SIZE = 88;

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ACTIVE:       { label: 'Mavitrika',     color: COLORS.primaryLight },
  UNDER_REVIEW: { label: 'Voasedra',      color: '#E8A000' },
  INACTIVE:     { label: 'Tsy mavitrika', color: COLORS.textMuted },
};

export function MyListingsScreen() {
  const navigation        = useNavigation<Nav>();
  const { user, token }   = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Reload every time screen comes into focus (e.g. after posting a new listing)
  useFocusEffect(useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/users/${user.id}/listings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setListings)
      .catch(() => Alert.alert('Diso', 'Tsy afaka naka ny lisitra'))
      .finally(() => setLoading(false));
  }, [user?.id]));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Ny lisitray</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PostListing')}
          hitSlop={8}
        >
          <Ionicons name="add-circle" size={28} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {listings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="home-outline" size={52} color={COLORS.primaryLight} />
          <Text style={styles.emptyTitle}>Tsy misy lisitra mbola</Text>
          <Text style={styles.emptySub}>Tsindrio ny + mba hanampy ny voalohany.</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MyListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

function MyListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const status = STATUS_LABEL[listing.status] ?? STATUS_LABEL.ACTIVE;
  return (
    <TouchableOpacity style={card.outer} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['rgba(255,255,255,0.97)', 'rgba(236,236,236,0.91)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={card.container}
      >
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

        <View style={card.info}>
          <Text style={card.price}>
            {Number(listing.priceMga).toLocaleString('fr-MG')}
            <Text style={card.priceSuffix}> MGA</Text>
          </Text>
          <Text style={card.title} numberOfLines={1}>{listing.title}</Text>
          <Text style={card.location} numberOfLines={1}>
            {listing.city} · {listing.region}
          </Text>
          <View style={[card.statusBadge, { backgroundColor: status.color + '22' }]}>
            <Text style={[card.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={card.chevron} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal:  16,
    paddingTop:         60,
    paddingBottom:      12,
    backgroundColor:   COLORS.surface,
    borderBottomWidth:  1,
    borderBottomColor: COLORS.border,
  },
  heading:   { fontSize: 18, fontWeight: '800', color: COLORS.text },
  addBtn:    {},
  list:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle:{ fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySub:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});

const card = StyleSheet.create({
  outer: {
    borderRadius:  14,
    marginBottom:   9,
    shadowColor:   '#000',
    shadowOpacity:  0.09,
    shadowRadius:   8,
    shadowOffset:  { width: 0, height: 2 },
    elevation:      3,
  },
  container: {
    flexDirection: 'row',
    borderRadius:  14,
    overflow:      'hidden',
    borderWidth:    1,
    borderColor:   'rgba(255,255,255,0.88)',
    alignItems:    'center',
  },
  image: { width: IMAGE_SIZE, height: IMAGE_SIZE, position: 'relative' },
  typePill: {
    position:          'absolute',
    bottom:             4,
    left:               4,
    backgroundColor:   'rgba(0,0,0,0.55)',
    borderRadius:       4,
    paddingHorizontal:  5,
    paddingVertical:    2,
  },
  typePillText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  info:         { flex: 1, padding: 12, gap: 3 },
  price:        { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  priceSuffix:  { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  title:        { fontSize: 13, fontWeight: '600', color: COLORS.text },
  location:     { fontSize: 11, color: COLORS.textMuted },
  statusBadge:  { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  chevron:      { paddingRight: 12 },
});
