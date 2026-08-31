import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { useLanguage } from '../i18n/LanguageContext';
import { useProfile } from '../state/ProfileContext';
import { getConflict, addConflictNote, updateConflictStatus } from '../api/conflicts';
import { ApiError } from '../api/client';
import { sqmToAcres } from '../utils/format';
import { ringToLatLngs, regionForRings } from '../utils/geo';

export default function DisputeDetailScreen({ route }) {
  const { conflictId } = route.params;
  const { t } = useLanguage();
  const { profile } = useProfile();
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [posting, setPosting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getConflict(conflictId);
      setConflict(data);
    } catch (err) {
      console.error('load conflict failed:', err);
    } finally {
      setLoading(false);
    }
  }, [conflictId]);

  useEffect(() => {
    load();
  }, [load]);

  const ringA = conflict?.trace_a_geometry?.coordinates?.[0];
  const ringB = conflict?.trace_b_geometry?.coordinates?.[0];
  const overlapRing = conflict?.overlap_geometry?.coordinates?.[0];
  const mapRegion = useMemo(() => (ringA && ringB ? regionForRings([ringA, ringB]) : null), [ringA, ringB]);

  if (loading || !conflict) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#1a3c2b" />
      </SafeAreaView>
    );
  }

  const isA = conflict.farmer_a_id === profile?.id;
  const mine = isA
    ? { label: conflict.trace_a_label, area: conflict.trace_a_area_sqm, pct: conflict.overlap_pct_a }
    : { label: conflict.trace_b_label, area: conflict.trace_b_area_sqm, pct: conflict.overlap_pct_b };
  const theirs = isA
    ? { label: conflict.trace_b_label, area: conflict.trace_b_area_sqm, pct: conflict.overlap_pct_b }
    : { label: conflict.trace_a_label, area: conflict.trace_a_area_sqm, pct: conflict.overlap_pct_a };
  const myRing = isA ? ringA : ringB;
  const theirRing = isA ? ringB : ringA;

  const onPostNote = async () => {
    if (!noteText.trim()) return;
    setPosting(true);
    try {
      await addConflictNote(conflictId, noteText.trim());
      setNoteText('');
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to post note');
    } finally {
      setPosting(false);
    }
  };

  const onSetStatus = async (status) => {
    setUpdating(true);
    try {
      await updateConflictStatus(conflictId, status);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.compareRow}>
            <View style={styles.compareBox}>
              <Text style={styles.compareLabel}>{t('yourField')}</Text>
              <Text style={styles.compareName}>{mine.label}</Text>
              <Text style={styles.compareAcres}>
                {sqmToAcres(mine.area).toFixed(1)} {t('acres')}
              </Text>
            </View>
            <View style={styles.compareBox}>
              <Text style={styles.compareLabel}>{t('theirField')}</Text>
              <Text style={styles.compareName}>{theirs.label}</Text>
              <Text style={styles.compareAcres}>
                {sqmToAcres(theirs.area).toFixed(1)} {t('acres')}
              </Text>
            </View>
          </View>

          <View style={styles.overlapBox}>
            <Text style={styles.overlapTitle}>
              {t('disputedArea')}: {sqmToAcres(conflict.overlap_sqm).toFixed(2)} {t('acres')}
            </Text>
            <Text style={styles.overlapSub}>
              {Math.round(mine.pct ?? 0)}% {t('ofYourField')} · {Math.round(theirs.pct ?? 0)}% {t('ofTheirField')}
            </Text>
          </View>

          {mapRegion ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                mapType="hybrid"
                region={mapRegion}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                {myRing && (
                  <Polygon
                    coordinates={ringToLatLngs(myRing)}
                    fillColor="rgba(74, 222, 128, 0.2)"
                    strokeColor="#16a34a"
                    strokeWidth={2.5}
                  />
                )}
                {theirRing && (
                  <Polygon
                    coordinates={ringToLatLngs(theirRing)}
                    fillColor="rgba(96, 165, 250, 0.2)"
                    strokeColor="#2563eb"
                    strokeWidth={2.5}
                  />
                )}
                {overlapRing && (
                  <Polygon
                    coordinates={ringToLatLngs(overlapRing)}
                    fillColor="rgba(239, 68, 68, 0.45)"
                    strokeColor="#dc2626"
                    strokeWidth={1.5}
                  />
                )}
              </MapView>
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: '#16a34a' }]} />
                  <Text style={styles.legendText}>{t('yourField')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: '#2563eb' }]} />
                  <Text style={styles.legendText}>{t('theirField')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: '#dc2626' }]} />
                  <Text style={styles.legendText}>{t('overlap')}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>{t('disputeMapComingSoon')}</Text>
            </View>
          )}

          <Text style={styles.notesTitle}>{t('notes')}</Text>
          {conflict.notes.map((n) => {
            const isMine = n.author_id === profile?.id;
            return (
              <View key={n.id} style={[styles.noteBubble, isMine && styles.noteBubbleMine]}>
                <Text style={[styles.noteAuthor, isMine && styles.noteTextMine]}>
                  {isMine ? t('you') : n.author_name}
                </Text>
                <Text style={[styles.noteBody, isMine && styles.noteTextMine]}>{n.body}</Text>
              </View>
            );
          })}

          {conflict.status === 'open' && (
            <View style={styles.statusActions}>
              <TouchableOpacity style={styles.resolveButton} disabled={updating} onPress={() => onSetStatus('resolved')}>
                <Text style={styles.resolveText}>{t('markResolved')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dismissButton} disabled={updating} onPress={() => onSetStatus('dismissed')}>
                <Text style={styles.dismissText}>{t('dismiss')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {conflict.status === 'open' && (
          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder={t('writeNote')}
            />
            <TouchableOpacity style={styles.sendButton} onPress={onPostNote} disabled={posting || !noteText.trim()}>
              <Text style={styles.sendText}>➤</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f1ef' },
  content: { padding: 20, paddingBottom: 12 },
  compareRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  compareBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ececeb' },
  compareLabel: { fontSize: 10, color: '#9a9a94', textTransform: 'uppercase', marginBottom: 4 },
  compareName: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  compareAcres: { fontSize: 13, color: '#6b6b6b', marginTop: 2 },
  overlapBox: { backgroundColor: '#eaf2ff', borderRadius: 10, padding: 14, marginBottom: 12 },
  overlapTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  overlapSub: { fontSize: 12, color: '#4a5a70', marginTop: 4 },
  mapPlaceholder: {
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8d8d4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mapPlaceholderText: { fontSize: 12, color: '#9a9a94' },
  mapContainer: { height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  map: { flex: 1 },
  mapLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingVertical: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 9, height: 9, borderRadius: 2 },
  legendText: { fontSize: 11, color: '#1a1a1a', fontWeight: '600' },
  notesTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  noteBubble: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ececeb',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  noteBubbleMine: { alignSelf: 'flex-end', backgroundColor: '#1a3c2b', borderColor: '#1a3c2b' },
  noteAuthor: { fontSize: 10, fontWeight: '700', color: '#9a9a94', marginBottom: 2 },
  noteBody: { fontSize: 13, color: '#1a1a1a' },
  noteTextMine: { color: '#fff' },
  statusActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  resolveButton: { flex: 1, backgroundColor: '#1a7a3f', borderRadius: 8, alignItems: 'center', paddingVertical: 12 },
  resolveText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  dismissButton: { flex: 1, borderRadius: 8, alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#d8d8d4' },
  dismissText: { color: '#1a1a1a', fontWeight: '600', fontSize: 13 },
  noteInputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ececeb',
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
  },
  noteInput: { flex: 1, borderWidth: 1, borderColor: '#d8d8d4', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a3c2b', alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 16 },
});
