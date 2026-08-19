import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../state/ProfileContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import DisputeDetailScreen from '../screens/DisputeDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isLoading, isSignedIn } = useAuth();
  const { refresh, clear } = useProfile();

  useEffect(() => {
    if (isSignedIn) {
      refresh().catch((err) => console.error('profile refresh failed:', err));
    } else {
      clear();
    }
  }, [isSignedIn, refresh, clear]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1a3c2b" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isSignedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="DisputeDetail"
            component={DisputeDetailScreen}
            options={{
              headerShown: true,
              title: 'Boundary Dispute',
              headerStyle: { backgroundColor: '#1a3c2b' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: true,
              title: 'Profile',
              headerStyle: { backgroundColor: '#1a3c2b' },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = {
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f1ef' },
};
