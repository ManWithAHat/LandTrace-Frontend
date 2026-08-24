import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { requestOtp } from '../api/auth';
import { ApiError } from '../api/client';
import Logo from '../components/Logo';

export default function SignInScreen({ navigation }) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSend = async () => {
    setError(null);
    const fullPhone = `+91${phone.replace(/\D/g, '')}`;
    setLoading(true);
    try {
      await requestOtp(fullPhone);
      navigation.navigate('VerifyOtp', { phone: fullPhone });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <View style={styles.top}>
          <Logo size={56} />
          <Text style={styles.appName}>{t('appName')}</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.prompt}>{t('enterMobile')}</Text>
          <Text style={styles.label}>{t('mobileNumber')}</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="9876543210"
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, (loading || phone.length !== 10) && styles.buttonDisabled]}
            onPress={onSend}
            disabled={loading || phone.length !== 10}
          >
            <Text style={styles.buttonText}>{loading ? '...' : t('sendOtp')}</Text>
          </TouchableOpacity>
          <Text style={styles.privacyText}>{t('neverShare')}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 32 },
  top: { alignItems: 'center', marginTop: 96 },
  appName: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  tagline: { fontSize: 13, color: '#6b6b6b', marginTop: 4 },
  bottom: {},
  prompt: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 12, color: '#6b6b6b', marginBottom: 6 },
  phoneRow: { flexDirection: 'row', marginBottom: 8 },
  prefixBox: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#e9e9e6',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d4',
  },
  prefixText: { fontSize: 15, color: '#1a1a1a' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d8d8d4',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  errorText: { color: '#b3261e', fontSize: 13, marginBottom: 8 },
  button: { backgroundColor: '#1a3c2b', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  privacyText: { fontSize: 11, color: '#9a9a94', textAlign: 'center', marginTop: 10 },
});
