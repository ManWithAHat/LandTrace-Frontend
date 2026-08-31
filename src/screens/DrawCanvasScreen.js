import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  AppState,
  ActivityIndicator,
} from 'react-native';
import MapView, { Polygon, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../i18n/LanguageContext';
import { computePolygonStats } from '../utils/calculations';
import { sqmToAcres } from '../utils/format';
import { haversineDistance, toLatLng } from '../utils/geo';
import { createTrace } from '../api/traces';
import { ApiError } from '../api/client';
import { LOCATION_TASK, RAW_COORDS_KEY, setLocationHandler } from '../tasks/locationTask';

const MIN_DISTANCE_METERS = 2;
const MAX_ACCEPTABLE_ACCURACY = 10;

const STATUS = { IDLE: 'idle', TRACING: 'tracing', DONE: 'done' };

export default function DrawCanvasScreen({ navigation }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState(STATUS.IDLE);
  const [coords, setCoords] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accuracy, setAccuracy] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const statusRef = useRef(STATUS.IDLE);
  const coordsRef = useRef([]);
  const mapRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Mount-once, not focus-based: this screen stays mounted in the Draw
  // tab's stack across tab switches, and a real background GPS trace must
  // survive that (that's the whole point of background tracking). A fresh
  // trace resets state when Start is pressed (startTracing below), not
  // whenever the screen happens to regain focus.
  useEffect(() => {
    requestLocationAndInit();
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
      setLocationHandler(null);
      Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
      AsyncStorage.removeItem(RAW_COORDS_KEY).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestLocationAndInit() {
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert(t('locationPermissionTitle'), t('locationPermissionBody'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      // Background permission lets tracking continue with the screen off.
      // On Android 11+ this opens system settings; we proceed either way.
      await Location.requestBackgroundPermissionsAsync();

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentPos([loc.coords.longitude, loc.coords.latitude]);
      setLoading(false);
    } catch (err) {
      Alert.alert(t('locationErrorTitle'), t('locationErrorBody'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }

  // The background task always persists raw points to AsyncStorage, so
  // whatever was collected while the screen was backgrounded (or the app
  // was killed and restarted by the OS) is recovered from here.
  async function syncFromStorage() {
    try {
      const raw = await AsyncStorage.getItem(RAW_COORDS_KEY);
      if (!raw) return;
      const pts = JSON.parse(raw);
      const filtered = [];
      for (const pt of pts) {
        if (pt.acc > MAX_ACCEPTABLE_ACCURACY) continue;
        const newPt = [pt.lon, pt.lat];
        const prev = filtered[filtered.length - 1];
        if (!prev || haversineDistance(prev, newPt) >= MIN_DISTANCE_METERS) filtered.push(newPt);
      }
      coordsRef.current = filtered;
      setCoords([...filtered]);
      if (filtered.length > 0) setCurrentPos(filtered[filtered.length - 1]);
    } catch {
      // fall back to whatever's already in state
    }
  }

  async function handleAppStateChange(nextState) {
    const wasBackground = appStateRef.current.match(/inactive|background/);
    appStateRef.current = nextState;
    if (wasBackground && nextState === 'active' && statusRef.current === STATUS.TRACING) {
      await syncFromStorage();
    }
  }

  async function startTracing() {
    coordsRef.current = [];
    setCoords([]);
    setError(null);
    statusRef.current = STATUS.TRACING;
    setStatus(STATUS.TRACING);

    try {
      await AsyncStorage.removeItem(RAW_COORDS_KEY);
    } catch {
      // non-fatal
    }

    // Foreground handler: called by the background task when the app is
    // active, for smooth map following and live point/accuracy updates.
    setLocationHandler((locations) => {
      for (const loc of locations) {
        const newPt = [loc.coords.longitude, loc.coords.latitude];
        setCurrentPos(newPt);
        setAccuracy(loc.coords.accuracy);

        mapRef.current?.animateToRegion(
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.001, longitudeDelta: 0.001 },
          300
        );

        if (loc.coords.accuracy > MAX_ACCEPTABLE_ACCURACY) continue;

        const prev = coordsRef.current[coordsRef.current.length - 1];
        if (!prev || haversineDistance(prev, newPt) >= MIN_DISTANCE_METERS) {
          coordsRef.current = [...coordsRef.current, newPt];
          setCoords([...coordsRef.current]);
        }
      }
    });

    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1000,
        // Android: keeps tracking when the screen is off via a foreground service.
        foregroundService: {
          notificationTitle: t('trackingNotificationTitle'),
          notificationBody: t('trackingNotificationBody'),
          notificationColor: '#1a3c2b',
        },
        // iOS: shows the blue location pill in the status bar while backgrounded.
        showsBackgroundLocationIndicator: true,
      });
    } catch (err) {
      statusRef.current = STATUS.IDLE;
      setStatus(STATUS.IDLE);
      setLocationHandler(null);
      Alert.alert(t('gpsErrorTitle'), t('gpsErrorBody'));
    }
  }

  async function stopTracing() {
    await syncFromStorage();
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
    setLocationHandler(null);

    if (coordsRef.current.length < 3) {
      Alert.alert(t('needMorePoints'));
      statusRef.current = STATUS.IDLE;
      setStatus(STATUS.IDLE);
      setCoords([]);
      coordsRef.current = [];
      return;
    }
    statusRef.current = STATUS.DONE;
    setStatus(STATUS.DONE);
  }

  function confirmDiscard() {
    Alert.alert(t('discardTraceConfirmTitle'), t('discardTraceConfirmBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('discard'),
        style: 'destructive',
        onPress: () => {
          statusRef.current = STATUS.IDLE;
          setStatus(STATUS.IDLE);
          setCoords([]);
          coordsRef.current = [];
          setShowSaveModal(false);
        },
      },
    ]);
  }

  const onSave = async () => {
    if (!fieldName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const ring = [...coordsRef.current, coordsRef.current[0]];
      await createTrace({
        geometry: { type: 'Polygon', coordinates: [ring] },
        local_id: `field-${Date.now()}`,
        label: fieldName.trim(),
      });
      setShowSaveModal(false);
      statusRef.current = STATUS.IDLE;
      setStatus(STATUS.IDLE);
      setCoords([]);
      coordsRef.current = [];
      navigation.navigate('MyLandTab');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save trace');
    } finally {
      setSaving(false);
    }
  };

  const stats = computePolygonStats(coords);
  const mapCoords = coords.map(toLatLng);

  return (
    <SafeAreaView style={styles.screen}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3c2b" />
          <Text style={styles.loadingText}>{t('gettingLocation')}</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType="hybrid"
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={
            currentPos
              ? { latitude: currentPos[1], longitude: currentPos[0], latitudeDelta: 0.001, longitudeDelta: 0.001 }
              : undefined
          }
        >
          {coords.length >= 3 && (
            <Polygon coordinates={mapCoords} fillColor="rgba(74, 222, 128, 0.25)" strokeColor="#16a34a" strokeWidth={2.5} />
          )}
          {coords.length >= 2 && coords.length < 3 && (
            <Polyline coordinates={mapCoords} strokeColor="#16a34a" strokeWidth={2.5} lineCap="round" lineJoin="round" />
          )}
        </MapView>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (status === STATUS.TRACING) {
            confirmDiscard();
          } else {
            navigation.goBack();
          }
        }}
      >
        <Text style={styles.backText}>‹ {t('back')}</Text>
      </TouchableOpacity>

      {accuracy !== null && status === STATUS.TRACING && (
        <View
          style={[
            styles.accuracyBadge,
            { backgroundColor: accuracy <= 5 ? '#16a34a' : accuracy <= 10 ? '#d97706' : '#dc2626' },
          ]}
        >
          <Text style={styles.accuracyText}>±{accuracy < 1 ? '<1' : Math.round(accuracy)}m</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        {status === STATUS.IDLE && (
          <>
            <Text style={styles.hint}>{t('walkHint')}</Text>
            {accuracy !== null && accuracy > MAX_ACCEPTABLE_ACCURACY && (
              <Text style={styles.weakSignal}>{t('weakSignal')}</Text>
            )}
            <TouchableOpacity style={styles.startButton} onPress={startTracing} disabled={loading}>
              <Text style={styles.startText}>{t('startTracing')}</Text>
            </TouchableOpacity>
          </>
        )}

        {status === STATUS.TRACING && (
          <>
            <View style={styles.tracingPill}>
              <View style={styles.dot} />
              <Text style={styles.tracingText}>
                {t('tracing')} {coords.length} {t('tracingPoints')}
              </Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={stopTracing}>
              <Text style={styles.stopText}>■ {t('stopComplete')}</Text>
            </TouchableOpacity>
          </>
        )}

        {status === STATUS.DONE && (
          <>
            <View style={styles.resultsRow}>
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>{t('acres')}</Text>
                <Text style={styles.resultValue}>{sqmToAcres(stats.areaSqm).toFixed(2)}</Text>
              </View>
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>{t('perimeter')}</Text>
                <Text style={styles.resultValue}>{Math.round(stats.perimeterM)} m</Text>
              </View>
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>{t('points')}</Text>
                <Text style={styles.resultValue}>{coords.length}</Text>
              </View>
            </View>
            <View style={styles.doneRow}>
              <TouchableOpacity style={styles.discardButton} onPress={confirmDiscard}>
                <Text style={styles.discardText}>{t('discard')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveTraceButton}
                onPress={() => {
                  setFieldName('');
                  setError(null);
                  setShowSaveModal(true);
                }}
              >
                <Text style={styles.saveTraceText}>{t('saveTrace')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  screen: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f1ef', gap: 12 },
  loadingText: { color: '#555', fontSize: 14 },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  accuracyBadge: { position: 'absolute', top: 16, right: 16, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  accuracyText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 24,
    gap: 12,
  },
  hint: { textAlign: 'center', color: '#666', fontSize: 13, lineHeight: 19 },
  weakSignal: { textAlign: 'center', color: '#dc2626', fontSize: 12, lineHeight: 17 },
  startButton: { backgroundColor: '#1a3c2b', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  tracingPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ef4444' },
  tracingText: { color: '#444', fontSize: 13, fontWeight: '500' },
  stopButton: { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  stopText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultsRow: { flexDirection: 'row', backgroundColor: '#f0faf4', borderRadius: 10, padding: 14, gap: 8 },
  resultBox: { flex: 1, alignItems: 'center' },
  resultLabel: { fontSize: 11, color: '#888', fontWeight: '500', marginBottom: 4 },
  resultValue: { fontSize: 15, fontWeight: '700', color: '#1a3c2b' },
  doneRow: { flexDirection: 'row', gap: 10 },
  discardButton: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f3f4f6' },
  discardText: { color: '#444', fontWeight: '600', fontSize: 14 },
  saveTraceButton: { flex: 2, borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: '#1a3c2b' },
  saveTraceText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d8d8d4' },
  modalCancelText: { color: '#1a1a1a', fontSize: 14 },
  modalSave: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#1a3c2b' },
  modalSaveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
});
