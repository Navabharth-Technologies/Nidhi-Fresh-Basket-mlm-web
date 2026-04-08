import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root, #root > div {
          height: 100% !important;
          width: 100% !important;
          overflow: hidden !important;
          margin: 0;
          padding: 0;
        }
        /* Ensure the main app container fills the viewport */
        [data-contents="true"], .css-view-175oi2r {
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
      `;
      document.head.append(style);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, minHeight: '100%' }}>
      <LinearGradient 
        colors={['#e0f2fe', '#f0fdf4', '#dcfce7']} 
        style={{ flex: 1, minHeight: '100%' }}
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
