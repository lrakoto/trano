import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { SatelliteThumb } from '../components/SatelliteThumb';
import { useSaved } from '../hooks/useSaved';
import { COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';
import type { Listing } from '@trano/shared';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMAGE_SIZE = 88;

export function SavedScreen() {
  const navigation    = useNavigation<Nav>();
  const { saved, toggle } = useSaved();

  if (saved.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={52} color={COLORS.primaryLight} />
          <Text style={styles.emptyTitle}>Trano Voatahiry</Text>
          <Text style={styles.emptySub}>
            Ny trano tianao dia hiseho eto.{'\n'}Tsindrio ny ♡ amin'ny lisitra mba hitahiry azy.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <Text style={styles.heading}>Voatahiry ({saved.length})</Text>
      <FlatList
        data={saved}
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
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySub:   { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
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
