import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { sqmToAcres, formatDate } from '../utils/format';

const STATUS_COLORS = {
  open: { bg: '#fdf3e0', text: '#b8860b' },
  resolved: { bg: '#e3f3e8', text: '#1a7a3f' },
  dismissed: { bg: '#ececeb', text: '#6b6b6b' },
};

/**
 * The list endpoint doesn't say which side is "me" — only names/phone/village
 * for farmer_a and farmer_b, no farmer_a_id/farmer_b_id. We work out which
 * side is mine by checking whether trace_a_id is one of my own trace IDs
 * (from GET /traces) rather than matching phone strings, which sidesteps
 * any formatting mismatch between how a phone is stored vs. displayed.
 */
export default function DisputeCard({ conflict, myTraceIds, onPress }) {
  const { t } = useLanguage();
  const colors = STATUS_COLORS[conflict.status] ?? STATUS_COLORS.open;

  const isA = myTraceIds?.has(conflict.trace_a_id) ?? false;
  const otherName = isA ? conflict.farmer_b_name : conflict.farmer_a_name;
  const otherVillage = isA ? conflict.farmer_b_village : conflict.farmer_a_village;
  const myPct = isA ? conflict.overlap_pct_a : conflict.overlap_pct_b;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{otherName ?? '—'}</Text>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>{t(conflict.status)}</Text>
        </View>
      </View>
      <Text style={styles.village}>{otherVillage ?? ''}</Text>
      <Text style={styles.overlap}>
        {t('overlap')}: {sqmToAcres(conflict.overlap_sqm).toFixed(2)} {t('acres')} ({Math.round(myPct ?? 0)}%)
      </Text>
      <Text style={styles.date}>
        {t('detected')} {formatDate(conflict.detected_at)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ececeb',
    borderLeftWidth: 3,
    borderLeftColor: '#1a3c2b',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  village: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  overlap: { fontSize: 12, color: '#1a1a1a', marginTop: 8 },
  date: { fontSize: 11, color: '#9a9a94', marginTop: 4 },
});
