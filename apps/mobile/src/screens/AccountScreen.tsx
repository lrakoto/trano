import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Button, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import { API_BASE_URL, COLORS } from '../constants';
import type { RootStackParamList } from '../navigation';

type BlockedUser = { id: string; name: string };
type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

export function AccountScreen({ navigation }: Props) {
  const { user, token, deleteAccount } = useAuth();
  const { clear: clearSaved } = useSaved();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [blockStatus, setBlockStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!token) return;
    const abort = new AbortController();
    setBlockStatus('loading');
    fetch(`${API_BASE_URL}/listings/blocked-users`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: abort.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error('Unable to load blocked users');
      setBlocked(await response.json());
      setBlockStatus('ready');
    }).catch(() => {
      if (!abort.signal.aborted) setBlockStatus('error');
    });
    return () => abort.abort();
  }, [token]));

  const unblock = async (id: string) => {
    setUnblocking(id);
    try {
      const response = await fetch(`${API_BASE_URL}/listings/blocked-users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Unable to unblock user');
      setBlocked((users) => users.filter((blockedUser) => blockedUser.id !== id));
    } catch {
      Alert.alert('Tsy vita', 'Andramo indray azafady.');
    } finally {
      setUnblocking(null);
    }
  };

  const removeAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(password);
      await clearSaved().catch(() => undefined);
      setPassword('');
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
      Alert.alert('Voafafa ny kaontinao');
    } catch (error) {
      Alert.alert('Tsy vita', error instanceof Error ? error.message : 'Andramo indray azafady.');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.heading}>{user.name}</Text>
          <Text style={styles.body}>{user.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Olona nosakanana</Text>
          {blockStatus === 'loading' && <ActivityIndicator />}
          {blockStatus === 'error' && <Text style={styles.body}>Tsy voaray ny lisitra. Andramo indray.</Text>}
          {blockStatus === 'ready' && blocked.length === 0 && (
            <Text style={styles.body}>Tsy misy olona nosakananao.</Text>
          )}
          {blockStatus === 'ready' && blocked.map(({ id, name }) => (
            <View key={id} style={styles.row}>
              <Text style={[styles.body, styles.name]}>{name}</Text>
              <Button title={unblocking === id ? 'Andraso…' : 'Esory ny sakana'} onPress={() => unblock(id)} disabled={!!unblocking} />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Famafana kaonty</Text>
          {confirming ? (
            <>
              <Text style={styles.body}>
                Ho voafafa tanteraka ny kaontinao sy ny lisitrao. Ampidiro ny tenimiafinao hanamafisana izany.
              </Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Tenimiafina"
                placeholderTextColor={COLORS.textMuted}
                accessibilityLabel="Tenimiafina"
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                editable={!deleting}
              />
              <Button title={deleting ? 'Mamafa…' : 'Hamafiso ny famafana'} color={COLORS.danger} disabled={!password || deleting} onPress={removeAccount} />
              <Button title="Aoka ihany" disabled={deleting} onPress={() => { setPassword(''); setConfirming(false); }} />
            </>
          ) : <Button title="Fafao ny kaontiko" color={COLORS.danger} onPress={() => setConfirming(true)} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 16 },
  section: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, gap: 12 },
  heading: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  body: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1 },
  input: { borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, padding: 12, color: COLORS.text },
});
