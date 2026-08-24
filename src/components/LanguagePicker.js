import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

const OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
];

export default function LanguagePicker() {
  const { lang, setLanguage } = useLanguage();

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.code}
          style={[styles.option, lang === opt.code && styles.optionActive]}
          onPress={() => setLanguage(opt.code)}
        >
          <Text style={[styles.optionText, lang === opt.code && styles.optionTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'stretch', backgroundColor: '#e9e9e6', borderRadius: 10, padding: 3 },
  option: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  optionActive: { backgroundColor: '#fff' },
  optionText: { fontSize: 13, color: '#6b6b6b', fontWeight: '600' },
  optionTextActive: { color: '#1a3c2b' },
});
