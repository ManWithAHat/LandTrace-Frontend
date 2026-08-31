import React, { useState, useCallback } from 'react';
import { Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../i18n/LanguageContext';
import { listTraces } from '../api/traces';
import { listConflicts } from '../api/conflicts';
import Avatar from '../components/Avatar';
import TraceCard from '../components/TraceCard';

export default function MyLandScreen({ navigation }) {
  const { t } = useLanguage();
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
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Avatar />
        </TouchableOpacity>
      </View>

      <FlatList
        data={traces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const hasConflict = conflictedTraceIds.has(item.id);
          return (
            <TraceCard
              trace={item}
              hasConflict={hasConflict}
              onPress={() => navigation.navigate('TraceDetail', { traceId: item.id, hasConflict })}
            />
          );
        }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{t('noTracesYet')}</Text> : null}
      />
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
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#9a9a94', marginTop: 40, fontSize: 13 },
});
