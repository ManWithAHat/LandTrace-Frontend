import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { AuthProvider } from './src/auth/AuthContext';
import { ProfileProvider } from './src/state/ProfileContext';
import RootNavigator from './src/navigation/RootNavigator';
import './src/tasks/locationTask'; // registers the background location task before any screen mounts

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LanguageProvider>
        <AuthProvider>
          <ProfileProvider>
            <RootNavigator />
          </ProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
