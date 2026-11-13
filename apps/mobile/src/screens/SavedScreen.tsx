import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { SatelliteThumb } from '../components/SatelliteThumb';
import { useSaved } from '../context/SavedContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';
import type { Listing } from '@trano/shared';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMAGE_SIZE = 88;

export function SavedScreen() {
  const navigation        = useNavigation<Nav>();
  const { user, token }   = useAuth();
  const { saved, toggle } = useSaved();
  const [visible, setVisible] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setVisible([]);
    setFailed(false);
    if (!token || !saved.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const load = async () => {
      const visibleById = new Map<string, Listing>();
      for (let start = 0; start < saved.length; start += 50) {
        const ids = saved.slice(start, start + 50).map(({ id }) => id).join(',');
        const result = await fetch(`${API_BASE_URL}/listings/saved?ids=${encodeURIComponent(ids)}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!result.ok) throw new Error('Could not load saved listings');
        const data: Listing[] = await result.json();
        for (const listing of data) visibleById.set(listing.id, listing);
      }
      if (!controller.signal.aborted) {
        setVisible(saved.flatMap(({ id }) => {
          const listing = visibleById.get(id);
          return listing ? [listing] : [];
        }));
      }
    };
    load()
      .catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt, saved, token]));

  if (!user) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Midira aloha</Text>
          <Text style={styles.emptySub}>Mila kaonty ianao mba hitahiry trano.</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnText}>Miditra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <ActivityIndicator style={styles.empty} color={COLORS.primary} />
      </View>
    );
  }

  if (visible.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={52} color={COLORS.primaryLight} />
          <Text style={styles.emptyTitle}>Trano Voatahiry</Text>
          <Text style={styles.emptySub}>
            {failed
              ? 'Tsy afaka naka ny lisitra voatahiry.'
              : 'Ny trano tianao dia hiseho eto.\nTsindrio ny ♡ amin’ny lisitra mba hitahiry azy.'}
          </Text>
          {failed && (
            <TouchableOpacity style={styles.loginBtn} onPress={() => setAttempt((value) => value + 1)}>
              <Text style={styles.loginBtnText}>Avereno andramana</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <Text style={styles.heading}>Voatahiry ({visible.length})</Text>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SavedCard
            listing={item}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            onRemove={() => toggle(item)}
          />
        )}
      />
    </View>
  );
}

function SavedCard({
  listing,
  onPress,
  onRemove,
}: {
  listing: Listing;
  onPress: () => void;
  onRemove: () => void;
}) {
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
        </View>

        <TouchableOpacity style={card.heart} onPress={onRemove} hitSlop={8}>
          <Ionicons name="heart" size={20} color="#FF4D6D" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  heading:    { fontSize: 22, fontWeight: '800', color: COLORS.text, margin: 20, marginBottom: 12 },
  list:       { paddingHorizontal: 16, paddingBottom: 32 },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle:   { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySub:     { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  loginBtn:     { marginTop: 8, backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  loginBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
});

const card = StyleSheet.create({
  outer: {
    borderRadius: 14,
    marginBottom:  9,
    shadowColor:  '#000',
    shadowOpacity: 0.09,
    shadowRadius:  8,
    shadowOffset: { width: 0, height: 2 },
    elevation:     3,
  },
  container: {
    flexDirection: 'row',
    borderRadius:  14,
    overflow:      'hidden',
    borderWidth:    1,
    borderColor:   'rgba(255,255,255,0.88)',
    alignItems:    'center',
  },
  image: {
    width:    IMAGE_SIZE,
    height:   IMAGE_SIZE,
    position: 'relative',
  },
  typePill: {
    position:        'absolute',
    bottom:           4,
    left:             4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius:     4,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  typePillText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  info: {
    flex:    1,
    padding: 12,
    gap:      3,
  },
  price:       { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  priceSuffix: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  title:       { fontSize: 13, fontWeight: '600', color: COLORS.text },
  location:    { fontSize: 11, color: COLORS.textMuted },
  heart:       { paddingRight: 14 },
});
