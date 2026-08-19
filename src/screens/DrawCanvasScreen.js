import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { useLanguage } from '../i18n/LanguageContext';
import { computePolygonStats } from '../utils/calculations';
import { sqmToAcres } from '../utils/format';
import { createTrace } from '../api/traces';
import { ApiError } from '../api/client';

// This screen stands in for real GPS boundary walking (which needs
// expo-location + a background task, and can't run in Expo Go — see
// the project README). Taps on the canvas are converted into synthetic
// lat/lng offsets from a fixed base coordinate, so the resulting GeoJSON
// polygon is real and exercises the actual upload + conflict-detection
// pipeline. Swap pixelToLatLng() for a live GPS watcher later; nothing
// downstream of this screen needs to change.
const BASE_LAT = 25.317;
const BASE_LNG = 82.9745;
const METERS_PER_PIXEL = 0.6;

function pixelToLatLng(x, y, originX, originY) {
  const dxMeters = (x - originX) * METERS_PER_PIXEL;
  const dyMeters = (originY - y) * METERS_PER_PIXEL;
  const dLat = dyMeters / 111320;
  const dLng = dxMeters / (111320 * Math.cos((BASE_LAT * Math.PI) / 180));
  return [BASE_LNG + dLng, BASE_LAT + dLat];
}

export default function DrawCanvasScreen({ navigation }) {
  const { t } = useLanguage();
  const [layout, setLayout] = useState(null);
  const [screenPoints, setScreenPoints] = useState([]);
  const [geoPoints, setGeoPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [error, setError] = useState(null);

  const stats = computePolygonStats(geoPoints);

  const onCanvasTouch = (evt) => {
    if (!layout) return;
    const { locationX, locationY } = evt.nativeEvent;
    setScreenPoints((prev) => [...prev, { x: locationX, y: locationY }]);
    setGeoPoints((prev) => [...prev, pixelToLatLng(locationX, locationY, layout.width / 2, layout.height / 2)]);
  };

  const undoLast = () => {
    setScreenPoints((prev) => prev.slice(0, -1));
    setGeoPoints((prev) => prev.slice(0, -1));
  };

  const onStopComplete = () => {
    if (geoPoints.length < 3) {
      Alert.alert(t('needMorePoints'));
      return;
    }
    setShowSaveModal(true);
  };

  const onSave = async () => {
    if (!fieldName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const ring = [...geoPoints, geoPoints[0]];
      await createTrace({
        geometry: { type: 'Polygon', coordinates: [ring] },
        local_id: `field-${Date.now()}`,
        label: fieldName.trim(),
      });
      setShowSaveModal(false);
      navigation.navigate('MyLandTab');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save trace');
    } finally {
      setSaving(false);
    }
  };

  const polylinePoints = screenPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.statText}>{Math.round(stats.areaSqm)} m²</Text>
      </View>

      <View
        style={styles.canvas}
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
        onStartShouldSetResponder={() => true}
        onResponderRelease={onCanvasTouch}
      >
        <Svg style={StyleSheet.absoluteFill}>
          {screenPoints.length > 1 && (
            <Polyline points={polylinePoints} fill="none" stroke="#4ade80" strokeWidth={2} />
          )}
          {screenPoints.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={5}
              fill={i === 0 ? '#4ade80' : '#ffffff'}
              stroke="#4ade80"
              strokeWidth={1.5}
            />
          ))}
        </Svg>
        {screenPoints.length === 0 && <Text style={styles.hint}>{t('tapToPlacePoints')}</Text>}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.tracingPill}>
          <View style={styles.dot} />
          <Text style={styles.tracingText}>
            {t('tracing')} {geoPoints.length} {t('tracingPoints')}
          </Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.undoButton} onPress={undoLast} disabled={screenPoints.length === 0}>
            <Text style={styles.undoText}>{t('undo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopButton} onPress={onStopComplete}>
            <Text style={styles.stopText}>■ {t('stopComplete')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('fieldName')}</Text>
            <Text style={styles.modalStats}>
              {sqmToAcres(stats.areaSqm).toFixed(2)} {t('acres')} · {Math.round(stats.perimeterM)} m
            </Text>
            <TextInput
              style={styles.modalInput}
              value={fieldName}
              onChangeText={setFieldName}
              placeholder={t('fieldName')}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSaveModal(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, (saving || !fieldName.trim()) && styles.buttonDisabled]}
                onPress={onSave}
                disabled={saving || !fieldName.trim()}
              >
                <Text style={styles.modalSaveText}>{saving ? '...' : t('saveTrace')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f2419' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backText: { color: '#fff', fontSize: 14 },
  statText: { color: '#cfe8d8', fontSize: 12 },
  canvas: { flex: 1, position: 'relative' },
  hint: { color: '#8fae9a', textAlign: 'center', marginTop: '50%', paddingHorizontal: 40, fontSize: 13 },
  bottomBar: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8 },
  tracingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 6 },
  tracingText: { color: '#fff', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  undoButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  undoText: { color: '#fff', fontSize: 14 },
  stopButton: { flex: 1, backgroundColor: '#c23b32', borderRadius: 8, alignItems: 'center', paddingVertical: 14 },
  stopText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  modalStats: { fontSize: 13, color: '#6b6b6b', marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d8d8d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  errorText: { color: '#b3261e', fontSize: 12, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d4',
  },
  modalCancelText: { color: '#1a1a1a', fontSize: 14 },
  modalSave: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#1a3c2b' },
  modalSaveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
});
