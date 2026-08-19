import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../i18n/LanguageContext';
import { listTraces } from '../api/traces';
import { listConflicts } from '../api/conflicts';
import LanguageToggle from '../components/LanguageToggle';
import Avatar from '../components/Avatar';
import TraceCard from '../components/TraceCard';

export default function MyLandScreen({ navigation }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('mine');
  const [traces, setTraces] = useState([]);
  const [conflictedTraceIds, setConflictedTraceIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tracesRes, conflictsRes] = await Promise.all([listTraces(), listConflicts('open')]);
      setTraces(tracesRes.traces);
      const ids = new Set();
      conflictsRes.conflicts.forEach((c) => {
        ids.add(c.trace_a_id);
        ids.add(c.trace_b_id);
      });
      setConflictedTraceIds(ids);
    } catch (err) {
      console.error('MyLand load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('myLandTraces')}</Text>
          <Text style={styles.subtitle}>
            {traces.length} {t('fieldsProtected')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <LanguageToggle />
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'mine' && styles.tabButtonActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>{t('myTraces')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'local' && styles.tabButtonActive]}
          onPress={() => setTab('local')}
        >
          <Text style={[styles.tabText, tab === 'local' && styles.tabTextActive]}>{t('localTraces')}</Text>
        </TouchableOpacity>
      </View>

      {tab === 'mine' ? (
        <FlatList
          data={traces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TraceCard trace={item} hasConflict={conflictedTraceIds.has(item.id)} />
          )}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>{t('noTracesYet')}</Text> : null}
        />
      ) : (
        <View style={styles.list}>
          <Text style={styles.empty}>{t('noLocalTraces')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#e9e9e6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, color: '#6b6b6b', fontWeight: '600' },
  tabTextActive: { color: '#1a1a1a' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9a9a94', marginTop: 40, fontSize: 13 },
});
