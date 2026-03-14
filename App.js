import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigation />
        <StatusBar style="light" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
