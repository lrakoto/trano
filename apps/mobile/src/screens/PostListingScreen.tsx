import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { SatelliteThumb } from '../components/SatelliteThumb';
import { COLORS, API_BASE_URL } from '../constants';
import { REGIONS } from '@trano/shared';
import type { RegionValue, ListingType, PropertyType } from '@trano/shared';

// TODO: image upload

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
  const navigation      = useNavigation();
  const { token }       = useAuth();
  const [loading,       setLoading]       = useState(false);
  const [locLoading,    setLocLoading]    = useState(false);
  const [form, setForm] = useState<FormState>({
    title: '', description: '', priceMga: '', addressFreeform: '',
    city: '', region: 'ANALAMANGA', latitude: '', longitude: '',
    whatsappContact: '', listingType: 'SALE', propertyType: 'HOUSE',
    bedrooms: '', bathrooms: '', areaSqm: '',
  });

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

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.priceMga || !form.addressFreeform || !form.city) {
      Alert.alert('Diso', 'Fenoy ny saha voaisy *');
      return;
    }
    if (!hasCoords) {
      Alert.alert('Diso', 'Ilaina ny toerana — tsindrio "Ampiasao ny toerana ankehitriny"');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/listings`, {
        method:  'POST',
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
        throw new Error(err.error ?? 'Tsy vita');
      }
      Alert.alert('Vita!', 'Ny lisitrao dia narosona soa aman-tsara.', [
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

        <GlassButton
          label="Manampy lisitra"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
        />

      </ScrollView>
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

  button: { marginTop: 32 },
});
