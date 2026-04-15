import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { SatelliteThumb } from '../components/SatelliteThumb';
import { KeyboardDismissBar } from '../components/KeyboardDismissBar';
import { COLORS, API_BASE_URL } from '../constants';
import { REGIONS } from '@trano/shared';
import type { RegionValue, ListingType, PropertyType, ListingImage } from '@trano/shared';
import type { RootStackParamList } from '../navigation';

type FormState = {
  title:           string;
  description:     string;
  priceMga:        string;
  addressFreeform: string;
  city:            string;
  region:          RegionValue;
  latitude:        string;
  longitude:       string;
  whatsappContact: string;
  listingType:     ListingType;
  propertyType:    PropertyType;
  bedrooms:        string;
  bathrooms:       string;
  areaSqm:         string;
};

const LISTING_TYPES:  { value: ListingType;  label: string }[] = [
  { value: 'RENT', label: 'Hofana' },
  { value: 'SALE', label: 'Amidy' },
];

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'HOUSE',      label: 'Trano' },
  { value: 'APARTMENT',  label: 'Appartement' },
  { value: 'LAND',       label: 'Tany' },
  { value: 'COMMERCIAL', label: 'Baolina' },
];

export function PostListingScreen() {
  const navigation   = useNavigation();
  const route        = useRoute<NativeStackScreenProps<RootStackParamList, 'PostListing'>['route']>();
  const listingId    = (route.params as any)?.listingId as string | undefined;
  const isEdit       = !!listingId;
  const { token }    = useAuth();
  const [loading,        setLoading]        = useState(false);
  const [locLoading,     setLocLoading]     = useState(false);
  const [pickedImages,   setPickedImages]   = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const [form, setForm] = useState<FormState>({
    title: '', description: '', priceMga: '', addressFreeform: '',
    city: '', region: 'ANALAMANGA', latitude: '', longitude: '',
    whatsappContact: '', listingType: 'SALE', propertyType: 'HOUSE',
    bedrooms: '', bathrooms: '', areaSqm: '',
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (!listingId) return;
    fetch(`${API_BASE_URL}/listings/${listingId}`)
      .then((r) => r.json())
      .then((l) => {
        setForm({
          title:           l.title,
          description:     l.description,
          priceMga:        String(l.priceMga),
          addressFreeform: l.addressFreeform,
          city:            l.city,
          region:          l.region,
          latitude:        String(l.latitude),
          longitude:       String(l.longitude),
          whatsappContact: l.whatsappContact ?? '',
          listingType:     l.listingType,
          propertyType:    l.propertyType,
          bedrooms:        l.bedrooms  != null ? String(l.bedrooms)  : '',
          bathrooms:       l.bathrooms != null ? String(l.bathrooms) : '',
          areaSqm:         l.areaSqm   != null ? String(l.areaSqm)   : '',
        });
        setExistingImages(l.images ?? []);
      })
      .catch(() => Alert.alert('Diso', 'Tsy afaka naka ny lisitra'));
  }, [listingId]);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const hasCoords = form.latitude !== '' && form.longitude !== '';

  const handleUseLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Tsy azo', 'Ilaina ny alalana hahita ny toeranao');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setForm((prev) => ({
        ...prev,
        latitude:  loc.coords.latitude.toFixed(6),
        longitude: loc.coords.longitude.toFixed(6),
      }));
    } catch {
      Alert.alert('Diso', 'Tsy afaka mahita ny toerana');
    } finally {
      setLocLoading(false);
    }
  };

  const totalImages = existingImages.length + pickedImages.length;

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Tsy azo', 'Ilaina ny alalana haka sary');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: Math.max(1, 10 - totalImages),
    });
    if (!result.canceled && result.assets.length > 0) {
      setPickedImages((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10 - existingImages.length),
      );
    }
  };

  const removePickedImage = (index: number) => {
    setPickedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (image: ListingImage) => {
    if (!listingId) return;
    try {
      await fetch(`${API_BASE_URL}/listings/${listingId}/images/${image.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
    } catch {
      Alert.alert('Diso', 'Tsy afaka namafa ny sary');
    }
  };

  const uploadImages = async (id: string) => {
    for (const uri of pickedImages) {
      const filename  = uri.split('/').pop() ?? 'photo.jpg';
      const ext       = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType  = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const formData  = new FormData();
      formData.append('file', { uri, name: filename, type: mimeType } as any);
      const r = await fetch(`${API_BASE_URL}/listings/${id}/images`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
        throw new Error(err.message ?? err.error ?? `Sary tsy vita (${r.status})`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.priceMga || !form.addressFreeform || !form.city) {
      Alert.alert('Diso', 'Fenoy ny saha voaisy *');
      return;
    }
    if (form.description.length < 20) {
      Alert.alert('Diso', 'Ny famaritana dia tokony ho litera 20 farafahakeliny');
      return;
    }
    if (!hasCoords) {
      Alert.alert('Diso', 'Ilaina ny toerana — tsindrio "Ampiasao ny toerana ankehitriny"');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `${API_BASE_URL}/listings/${listingId}` : `${API_BASE_URL}/listings`,
        {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          title:           form.title,
          description:     form.description,
          priceMga:        parseInt(form.priceMga, 10),
          addressFreeform: form.addressFreeform,
          city:            form.city,
          region:          form.region,
          latitude:        parseFloat(form.latitude),
          longitude:       parseFloat(form.longitude),
          listingType:     form.listingType,
          propertyType:    form.propertyType,
          whatsappContact: form.whatsappContact || undefined,
          bedrooms:        form.bedrooms  ? parseInt(form.bedrooms, 10)  : undefined,
          bathrooms:       form.bathrooms ? parseInt(form.bathrooms, 10) : undefined,
          areaSqm:         form.areaSqm   ? parseFloat(form.areaSqm)    : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? err.error ?? 'Tsy vita');
      }
      const created = await res.json();
      const targetId = isEdit ? listingId! : created.id;
      if (pickedImages.length > 0) await uploadImages(targetId);
      Alert.alert('Vita!', isEdit ? 'Voanova ny lisitra.' : 'Ny lisitrao dia narosona soa aman-tsara.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Tsy vita', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isEdit && (
          <Text style={styles.editBanner}>Hanova lisitra</Text>
        )}

        <Field label="Lohateny *">
          <TextInput style={styles.input} value={form.title} onChangeText={set('title')}
            placeholder="ex: Trano 3 efitrano Antananarivo" />
        </Field>

        <Field label="Famaritana *">
          <TextInput style={[styles.input, styles.multiline]} value={form.description}
            onChangeText={set('description')} multiline
            placeholder="Lazao amin'ny antsipirihany ny trano..." />
        </Field>

        <Field label="Vidiny (MGA) *">
          <TextInput style={styles.input} value={form.priceMga} onChangeText={set('priceMga')}
            keyboardType="numeric" placeholder="ex: 500000" />
        </Field>

        <Field label="Karazana *">
          <SegmentedControl
            options={LISTING_TYPES}
            value={form.listingType}
            onChange={(v) => setForm((p) => ({ ...p, listingType: v as ListingType }))}
          />
        </Field>

        <Field label="Karazana fananana *">
          <SegmentedControl
            options={PROPERTY_TYPES}
            value={form.propertyType}
            onChange={(v) => setForm((p) => ({ ...p, propertyType: v as PropertyType }))}
          />
        </Field>

        <Field label="Adiresy *">
          <TextInput style={styles.input} value={form.addressFreeform}
            onChangeText={set('addressFreeform')} placeholder="ex: Akaikin'ny tsena Analakely" />
        </Field>

        <Field label="Tanàna *">
          <TextInput style={styles.input} value={form.city} onChangeText={set('city')}
            placeholder="ex: Antananarivo" />
        </Field>

        <Field label="Faritra *">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {REGIONS.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.chip, form.region === r.value && styles.chipActive]}
                  onPress={() => setForm((p) => ({ ...p, region: r.value }))}
                >
                  <Text style={[styles.chipText, form.region === r.value && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Field>

        {/* ── Location ───────────────────────────────────────────────── */}
        <Field label="Toerana *">
          <TouchableOpacity
            style={[styles.locationBtn, hasCoords && styles.locationBtnDone]}
            onPress={handleUseLocation}
            activeOpacity={0.8}
            disabled={locLoading}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <Text style={styles.locationBtnText}>
                {hasCoords ? '✓ Toerana voafaritra' : '📍 Ampiasao ny toerana ankehitriny'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Satellite preview once coords are set */}
          {hasCoords && (
            <View style={styles.mapPreview}>
              <SatelliteThumb
                latitude={parseFloat(form.latitude)}
                longitude={parseFloat(form.longitude)}
                width={styles.mapPreview.width as number}
                height={120}
                delta={0.003}
              />
            </View>
          )}

          {/* Manual override — collapsed by default */}
          <View style={styles.coordRow}>
            <TextInput
              style={[styles.input, styles.coordInput]}
              value={form.latitude}
              onChangeText={set('latitude')}
              keyboardType="decimal-pad"
              placeholder="Latitude"
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              style={[styles.input, styles.coordInput]}
              value={form.longitude}
              onChangeText={set('longitude')}
              keyboardType="decimal-pad"
              placeholder="Longitude"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </Field>

        {/* ── Optional stats ─────────────────────────────────────────── */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Efitrano">
              <TextInput style={styles.input} value={form.bedrooms} onChangeText={set('bedrooms')}
                keyboardType="number-pad" placeholder="3" />
            </Field>
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field label="Tambajotra">
              <TextInput style={styles.input} value={form.bathrooms} onChangeText={set('bathrooms')}
                keyboardType="number-pad" placeholder="1" />
            </Field>
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field label="m²">
              <TextInput style={styles.input} value={form.areaSqm} onChangeText={set('areaSqm')}
                keyboardType="decimal-pad" placeholder="80" />
            </Field>
          </View>
        </View>

        <Field label="Nomerao WhatsApp">
          <TextInput style={styles.input} value={form.whatsappContact}
            onChangeText={set('whatsappContact')} keyboardType="phone-pad"
            placeholder="+261 34 XX XXX XX" />
        </Field>

        {/* ── Images ────────────────────────────────────────────── */}
        <Field label="Sary (10 farafaharetsiny)">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={imgStyles.row}>
              {/* Existing images (edit mode) */}
              {existingImages.map((img) => (
                <View key={img.id} style={imgStyles.thumb}>
                  <Image source={{ uri: img.url }} style={imgStyles.img} />
                  <TouchableOpacity
                    style={imgStyles.removeBtn}
                    onPress={() => removeExistingImage(img)}
                    hitSlop={4}
                  >
                    <Text style={imgStyles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {/* Newly picked images */}
              {pickedImages.map((uri, i) => (
                <View key={uri} style={imgStyles.thumb}>
                  <Image source={{ uri }} style={imgStyles.img} />
                  <TouchableOpacity
                    style={imgStyles.removeBtn}
                    onPress={() => removePickedImage(i)}
                    hitSlop={4}
                  >
                    <Text style={imgStyles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {/* Add button */}
              {totalImages < 10 && (
                <TouchableOpacity style={imgStyles.addBtn} onPress={handlePickImages}>
                  <Text style={imgStyles.addIcon}>+</Text>
                  <Text style={imgStyles.addLabel}>Sary</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Field>

        <GlassButton
          label={isEdit ? 'Hanova' : 'Manampy lisitra'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
        />

      </ScrollView>
      <KeyboardDismissBar />
    </KeyboardAvoidingView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl({
  options, value, onChange,
}: {
  options:  { value: string; label: string }[];
  value:    string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={segStyles.row}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[segStyles.option, value === o.value && segStyles.optionActive]}
          onPress={() => onChange(o.value)}
        >
          <Text style={[segStyles.text, value === o.value && segStyles.textActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
});

const segStyles = StyleSheet.create({
  row:          { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5,
    borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.surface,
  },
  optionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '0D' },
  text:         { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  textActive:   { color: COLORS.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 20, paddingBottom: 48 },
  row:       { flexDirection: 'row' },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 12, fontSize: 15, color: COLORS.text,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  chipRow:   { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive:     { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '0D' },
  chipText:       { fontSize: 13, color: COLORS.textMuted },
  chipTextActive: { color: COLORS.primary, fontWeight: '600' },

  locationBtn: {
    backgroundColor:   COLORS.primary,
    borderRadius:       10,
    padding:            14,
    alignItems:        'center',
  },
  locationBtnDone: { backgroundColor: COLORS.primaryLight },
  locationBtnText: { color: COLORS.surface, fontWeight: '700', fontSize: 15 },
  mapPreview:      { marginTop: 10, borderRadius: 10, overflow: 'hidden', width: '100%' },
  coordRow:        { flexDirection: 'row', gap: 8, marginTop: 8 },
  coordInput:      { flex: 1, fontSize: 13, padding: 10 },

  button:     { marginTop: 32 },
  editBanner: { fontSize: 13, fontWeight: '700', color: COLORS.accent, marginBottom: 4 },
});

const imgStyles = StyleSheet.create({
  row:    { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  thumb:  { width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  img:    { width: 80, height: 80, borderRadius: 8 },
  removeBtn: {
    position:        'absolute',
    top:              3,
    right:            3,
    width:            20,
    height:           20,
    borderRadius:     10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  removeText: { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 14 },
  addBtn: {
    width:           80,
    height:          80,
    borderRadius:     8,
    borderWidth:      1.5,
    borderColor:     COLORS.border,
    borderStyle:     'dashed',
    backgroundColor: COLORS.surface,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              2,
  },
  addIcon:  { fontSize: 22, color: COLORS.primaryLight, fontWeight: '300' },
  addLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
});
