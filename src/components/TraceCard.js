import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { sqmToAcres, formatDate } from '../utils/format';

export default function TraceCard({ trace, hasConflict }) {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{trace.label ?? trace.local_id}</Text>
        <View style={[styles.badge, hasConflict ? styles.badgeConflict : styles.badgeClear]}>
          <Text style={[styles.badgeText, hasConflict ? styles.badgeTextConflict : styles.badgeTextClear]}>
            {hasConflict ? t('conflict') : t('clear')}
          </Text>
        </View>
      </View>
      <Text style={styles.acres}>{sqmToAcres(trace.area_sqm).toFixed(1)}</Text>
      <Text style={styles.meta}>
        {t('acres')} · {Math.round(trace.perimeter_m ?? 0)} m {t('boundary')}
      </Text>
      <Text style={styles.date}>
        {t('uploaded')} {formatDate(trace.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ececeb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeClear: { backgroundColor: '#e3f3e8' },
  badgeConflict: { backgroundColor: '#fde8e6' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextClear: { color: '#1a7a3f' },
  badgeTextConflict: { color: '#c23b32' },
  acres: { fontSize: 26, fontWeight: '700', color: '#1a3c2b', marginTop: 6 },
  meta: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  date: { fontSize: 11, color: '#9a9a94', marginTop: 6 },
});
