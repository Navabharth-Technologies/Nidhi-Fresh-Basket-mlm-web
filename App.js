import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';
import { LinearGradient } from 'expo-linear-gradient';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient 
        colors={['#e0f2fe', '#f0fdf4', '#dcfce7']} 
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AuthProvider>
          <AppNavigation />
          <StatusBar style="dark" />
        </AuthProvider>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}
