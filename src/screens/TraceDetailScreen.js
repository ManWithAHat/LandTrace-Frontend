import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Polygon } from 'react-native-maps';
import { useLanguage } from '../i18n/LanguageContext';
import { getTrace, deleteTrace } from '../api/traces';
import { ApiError } from '../api/client';
import { sqmToAcres, formatDate } from '../utils/format';
import { ringToLatLngs, regionForRings } from '../utils/geo';

export default function TraceDetailScreen({ route, navigation }) {
  const { traceId, hasConflict } = route.params;
  const { t } = useLanguage();
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTrace(traceId);
      setTrace(data);
    } catch (err) {
      console.error('load trace failed:', err);
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const ring = trace?.geometry?.coordinates?.[0];
  const mapCoords = useMemo(() => (ring ? ringToLatLngs(ring) : []), [ring]);
  const region = useMemo(() => (ring ? regionForRings([ring]) : null), [ring]);

  const onDelete = () => {
    Alert.alert(t('deleteFieldConfirmTitle'), t('deleteFieldConfirmBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteTrace(traceId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to delete');
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading || !trace) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#1a3c2b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {region && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            mapType="hybrid"
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Polygon coordinates={mapCoords} fillColor="rgba(74, 222, 128, 0.3)" strokeColor="#16a34a" strokeWidth={3} />
          </MapView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{trace.label ?? trace.local_id}</Text>
          <View style={[styles.badge, hasConflict ? styles.badgeConflict : styles.badgeClear]}>
            <Text style={[styles.badgeText, hasConflict ? styles.badgeTextConflict : styles.badgeTextClear]}>
              {hasConflict ? t('conflict') : t('clear')}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('acres')}</Text>
            <Text style={styles.statValue}>{sqmToAcres(trace.area_sqm).toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t('perimeter')}</Text>
            <Text style={styles.statValue}>{Math.round(trace.perimeter_m ?? 0)} m</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('tracedOn')}</Text>
          <Text style={styles.rowValue}>{formatDate(trace.traced_at)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('uploaded')}</Text>
          <Text style={styles.rowValue}>{formatDate(trace.created_at)}</Text>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={onDelete} disabled={deleting}>
          <Text style={styles.deleteText}>{deleting ? '...' : t('delete')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  mapContainer: { height: 260, borderBottomWidth: 1, borderBottomColor: '#ececeb' },
  map: { flex: 1 },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', flexShrink: 1, marginRight: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeClear: { backgroundColor: '#e3f3e8' },
  badgeConflict: { backgroundColor: '#fde8e6' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextClear: { color: '#1a7a3f' },
  badgeTextConflict: { color: '#c23b32' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#ececeb' },
  statLabel: { fontSize: 11, color: '#9a9a94', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1a3c2b' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ececeb',
  },
  rowLabel: { fontSize: 13, color: '#6b6b6b' },
  rowValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '600' },
  deleteButton: { alignItems: 'center', paddingVertical: 14, marginTop: 28 },
  deleteText: { color: '#c23b32', fontWeight: '600', fontSize: 14 },
});
