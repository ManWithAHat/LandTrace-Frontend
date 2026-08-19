import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MyLandScreen from '../screens/MyLandScreen';
import DrawIntroScreen from '../screens/DrawIntroScreen';
import DrawCanvasScreen from '../screens/DrawCanvasScreen';
import DisputesListScreen from '../screens/DisputesListScreen';
import { useLanguage } from '../i18n/LanguageContext';

const DrawStackNav = createStackNavigator();

function DrawStack() {
  return (
    <DrawStackNav.Navigator screenOptions={{ headerShown: false }}>
      <DrawStackNav.Screen name="DrawIntro" component={DrawIntroScreen} />
      <DrawStackNav.Screen name="DrawCanvas" component={DrawCanvasScreen} />
    </DrawStackNav.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a3c2b',
        tabBarInactiveTintColor: '#9a9a94',
      }}
    >
      <Tab.Screen name="MyLandTab" component={MyLandScreen} options={{ title: t('myLand') }} />
      <Tab.Screen name="DrawTab" component={DrawStack} options={{ title: t('draw') }} />
      <Tab.Screen name="DisputesTab" component={DisputesListScreen} options={{ title: t('disputes') }} />
    </Tab.Navigator>
  );
}
