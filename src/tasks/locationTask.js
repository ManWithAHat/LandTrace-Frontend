import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TASK = 'landtrace-location';
export const RAW_COORDS_KEY = '@landtrace/raw-trace';

// Set by DrawCanvasScreen while mounted; null in the headless background context.
let _locationHandler = null;
export const setLocationHandler = (fn) => {
  _locationHandler = fn;
};

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { locations } = data;

  // Always persist raw locations so points collected while the app is
  // backgrounded (screen off, task killed and restarted by iOS/Android)
  // aren't lost — the foreground screen re-syncs from this on resume.
  try {
    const stored = await AsyncStorage.getItem(RAW_COORDS_KEY);
    const prev = stored ? JSON.parse(stored) : [];
    const next = [
      ...prev,
      ...locations.map((l) => ({
        lon: l.coords.longitude,
        lat: l.coords.latitude,
        acc: l.coords.accuracy,
        ts: l.timestamp,
      })),
    ];
    await AsyncStorage.setItem(RAW_COORDS_KEY, JSON.stringify(next));
  } catch {
    // best-effort persistence; the in-memory handler below still fires
  }

  // When the app is foregrounded this callback runs in the main JS
  // context, so update React state directly for smooth live map updates.
  _locationHandler?.(locations);
});
