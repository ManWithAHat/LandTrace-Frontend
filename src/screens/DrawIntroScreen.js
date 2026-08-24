import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';

export default function DrawIntroScreen({ navigation }) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.pin}>
          <Text style={styles.pinGlyph}>📍</Text>
        </View>
        <Text style={styles.title}>{t('drawBoundaryTitle')}</Text>
        <Text style={styles.subtitle}>{t('drawBoundarySubtitle')}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DrawCanvas')}>
          <Text style={styles.buttonText}>{t('startTracing')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  pin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e3f3e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pinGlyph: { fontSize: 26 },
  title: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#6b6b6b', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#1a3c2b', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
