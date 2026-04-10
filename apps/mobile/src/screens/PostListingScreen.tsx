import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants';

// TODO: wire up auth token from context, region/type pickers, image upload, map pin

type FormState = {
  title:           string;
  description:     string;
  priceMga:        string;
  addressFreeform: string;
  city:            string;
  whatsappContact: string;
};

export function PostListingScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState<FormState>({
    title: '', description: '', priceMga: '',
    addressFreeform: '', city: '', whatsappContact: '',
  });

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    // Placeholder — full implementation needs auth context + region/type pickers
    Alert.alert(
      'Tsy vita mbola',
      'Ho ampiana: fitaovana fametrahana sary, fihodinana faritra, ary fanamafisana.',
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Field label="Lohateny *">
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={set('title')}
          placeholder="ex: Trano 3 efitrano Antananarivo"
        />
      </Field>

      <Field label="Famaritana *">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.description}
          onChangeText={set('description')}
          multiline
          placeholder="Lazao amin'ny antsipirihany ny trano..."
        />
      </Field>

      <Field label="Vidiny (MGA) *">
        <TextInput
          style={styles.input}
          value={form.priceMga}
          onChangeText={set('priceMga')}
          keyboardType="numeric"
          placeholder="ex: 500000"
        />
      </Field>

      <Field label="Adiresy *">
        <TextInput
          style={styles.input}
          value={form.addressFreeform}
          onChangeText={set('addressFreeform')}
          placeholder="ex: Akaikin'ny tsena Analakely"
        />
      </Field>

      <Field label="Tanàna *">
        <TextInput
          style={styles.input}
          value={form.city}
          onChangeText={set('city')}
          placeholder="ex: Antananarivo"
        />
      </Field>

      <Field label="Nomerao WhatsApp">
        <TextInput
          style={styles.input}
          value={form.whatsappContact}
          onChangeText={set('whatsappContact')}
          keyboardType="phone-pad"
          placeholder="+261 34 XX XXX XX"
        />
      </Field>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Manampy lisitra</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 20, paddingBottom: 48 },
  input: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 12, fontSize: 15, color: COLORS.text,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  button: {
    marginTop: 32, backgroundColor: COLORS.primary,
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
