import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { requestOtp } from '../api/auth';
import { ApiError } from '../api/client';
import LanguageToggle from '../components/LanguageToggle';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOtpScreen({ route, navigation }) {
  const { phone } = route.params;
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const code = digits.join('');

  const onChangeDigit = (text, index) => {
    const clean = text.replace(/\D/g, '');
    const next = [...digits];
    next[index] = clean.slice(-1);
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const onKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(phone, code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    try {
      await requestOtp(phone);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LanguageToggle style={styles.langToggle} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{t('verifyNumber')}</Text>
        <Text style={styles.subtitle}>
          {t('enterCodeSentTo')} {phone}
        </Text>

        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              style={styles.codeBox}
              value={d}
              onChangeText={(text) => onChangeDigit(text, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (loading || code.length !== CODE_LENGTH) && styles.buttonDisabled]}
          onPress={onVerify}
          disabled={loading || code.length !== CODE_LENGTH}
        >
          <Text style={styles.buttonText}>{loading ? '...' : t('verify')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onResend} disabled={secondsLeft > 0} style={styles.resendRow}>
          <Text style={styles.resendText}>
            {t('didntGetCode')}{' '}
            {secondsLeft > 0 ? `${t('resendIn')} 0:${String(secondsLeft).padStart(2, '0')}` : t('resend')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  langToggle: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  backButton: { position: 'absolute', top: 16, left: 16, zIndex: 1, padding: 8 },
  backText: { fontSize: 28, color: '#1a1a1a' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6b6b6b', marginBottom: 24 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  codeBox: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: '#d8d8d4',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#fff',
  },
  errorText: { color: '#b3261e', fontSize: 13, marginBottom: 12 },
  button: { backgroundColor: '#1a3c2b', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resendRow: { marginTop: 16, alignItems: 'center' },
  resendText: { fontSize: 12, color: '#9a9a94' },
});
