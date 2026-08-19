import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Logo({ size = 48 }) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Text style={[styles.glyph, { fontSize: size * 0.5 }]}>↗</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#e8f3ee',
    borderWidth: 1.5,
    borderColor: '#1a3c2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { color: '#1a3c2b', fontWeight: '700' },
});
