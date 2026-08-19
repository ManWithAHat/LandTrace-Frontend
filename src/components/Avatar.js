import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProfile } from '../state/ProfileContext';

export default function Avatar({ size = 36 }) {
  const { profile } = useProfile();
  const initial = (profile?.name?.[0] ?? profile?.phone?.slice(-1) ?? '?').toUpperCase();

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: '#1a3c2b', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
