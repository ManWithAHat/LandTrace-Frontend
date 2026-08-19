import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../i18n/LanguageContext';
import { useProfile } from '../state/ProfileContext';
import { listConflicts } from '../api/conflicts';
import LanguageToggle from '../components/LanguageToggle';
import DisputeCard from '../components/DisputeCard';

const STATUSES = ['all', 'open', 'resolved', 'dismissed'];

export default function DisputesListScreen({ navigation }) {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const [status, setStatus] = useState('open');
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      if (s === 'all') {
        const [open, resolved, dismissed] = await Promise.all([
          listConflicts('open'),
          listConflicts('resolved'),
          listConflicts('dismissed'),
        ]);
        setConflicts([...open.conflicts, ...resolved.conflicts, ...dismissed.conflicts]);
      } else {
        const res = await listConflicts(s);
        setConflicts(res.conflicts);
      }
    } catch (err) {
      console.error('load conflicts failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(status);
    }, [load, status])
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('boundaryDisputes')}</Text>
        <LanguageToggle />
      </View>

      <View style={styles.filterRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, status === s && styles.filterChipActive]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.filterText, status === s && styles.filterTextActive]}>{t(s)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={conflicts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DisputeCard
            conflict={item}
            myPhone={profile?.phone}
            onPress={() => navigation.navigate('DisputeDetail', { conflictId: item.id })}
          />
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{t('noDisputes')}</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e9e9e6' },
  filterChipActive: { backgroundColor: '#1a3c2b' },
  filterText: { fontSize: 12, color: '#6b6b6b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9a9a94', marginTop: 40, fontSize: 13 },
});
