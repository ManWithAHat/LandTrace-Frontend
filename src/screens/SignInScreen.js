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
  Modal,
  FlatList,
} from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { requestOtp } from '../api/auth';
import { ApiError } from '../api/client';
import LanguageToggle from '../components/LanguageToggle';
import Logo from '../components/Logo';

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)', length: 10 },
  { code: '+65', label: 'Singapore (+65)', length: 8 },
];

export default function SignInScreen({ navigation }) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(COUNTRY_CODES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const countryCode = country.code;

  const onSend = async () => {
    setError(null);
    const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
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
      <LanguageToggle style={styles.langToggle} />
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
            <TouchableOpacity style={styles.prefixBox} onPress={() => setPickerVisible(true)}>
              <Text style={styles.prefixText}>{countryCode}</Text>
              <Text style={styles.prefixCaret}>▾</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="number-pad"
              maxLength={country.length}
              placeholder={country.length === 8 ? '81234567' : '9876543210'}
            />
          </View>
          <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
              <View style={styles.modalCard}>
                <FlatList
                  data={COUNTRY_CODES}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setCountry(item);
                        setPhone('');
                        setPickerVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, (loading || phone.length !== country.length) && styles.buttonDisabled]}
            onPress={onSend}
            disabled={loading || phone.length !== country.length}
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
  langToggle: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 32 },
  top: { alignItems: 'center', marginTop: 96 },
  appName: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  tagline: { fontSize: 13, color: '#6b6b6b', marginTop: 4 },
  bottom: {},
  prompt: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 12, color: '#6b6b6b', marginBottom: 6 },
  phoneRow: { flexDirection: 'row', marginBottom: 8 },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#e9e9e6',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d4',
  },
  prefixText: { fontSize: 15, color: '#1a1a1a' },
  prefixCaret: { fontSize: 11, color: '#6b6b6b', marginLeft: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
  },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16 },
  modalItemText: { fontSize: 15, color: '#1a1a1a' },
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
