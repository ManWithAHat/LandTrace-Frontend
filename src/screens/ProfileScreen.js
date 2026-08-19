import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../state/ProfileContext';
import { getTokens, ApiError } from '../api/client';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const { profile, refresh, update } = useProfile();
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh().catch((err) => console.error('profile refresh failed:', err));
  }, [refresh]);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setVillage(profile.village ?? '');
    }
  }, [profile]);

  const onSave = async () => {
    setSaving(true);
    try {
      await update({ name, village });
      Alert.alert(t('saved'));
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    const { refresh: refreshToken } = await getTokens();
    await signOut(refreshToken);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(profile?.name?.[0] ?? profile?.phone?.slice(-1) ?? '?').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.phone}>{profile?.phone}</Text>

        <Text style={styles.label}>{t('fullName')}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('fullName')} />

        {/*
          The design's "Home address" field doesn't have a matching backend
          column — /users/me only has name/village/district/state/language.
          Mapped to `village` for now since it's the closest fit; flag if a
          real free-text address field should be added to the backend schema.
        */}
        <Text style={styles.label}>{t('homeAddress')}</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={village}
          onChangeText={setVillage}
          placeholder={t('homeAddress')}
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? '...' : t('save')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  content: { padding: 24, alignItems: 'center' },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a3c2b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  phone: { fontSize: 13, color: '#6b6b6b', marginBottom: 24 },
  label: { alignSelf: 'flex-start', fontSize: 12, color: '#6b6b6b', marginBottom: 6, marginTop: 12 },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#d8d8d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  saveButton: { alignSelf: 'stretch', backgroundColor: '#1a3c2b', borderRadius: 8, alignItems: 'center', paddingVertical: 14, marginTop: 24 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  logoutButton: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 14, marginTop: 12 },
  logoutText: { color: '#c23b32', fontWeight: '600', fontSize: 14 },
});
