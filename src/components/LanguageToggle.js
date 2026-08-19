import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle({ style }) {
  const { lang, toggle } = useLanguage();
  return (
    <TouchableOpacity style={[styles.pill, style]} onPress={toggle}>
      <Text style={styles.text}>{lang === 'en' ? 'हिंदी' : 'EN'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#d8d8d4',
  },
  text: { fontSize: 11, color: '#1a1a1a', fontWeight: '600' },
});
