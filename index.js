// 1. SILENCE ALL CONSOLE NOISE AT SOURCE (MUST BE FIRST)
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0] ? String(args[0]) : '';
    if (
      msg.includes('aria-hidden') || 
      msg.includes('retained focus') || 
      msg.includes('deprecated') ||
      msg.includes('useNativeDriver') ||
      msg.includes('pointerEvents') ||
      msg.includes('shadow') ||
      msg.includes('touch') ||
      msg.includes('Touch Bank')
    ) return;
    originalWarn.apply(console, args);
  };
  
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args[0] ? String(args[0]) : '';
    if (
      msg.includes('aria-hidden') || 
      msg.includes('retained focus')
    ) return;
    originalError.apply(console, args);
  };
}

import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

registerRootComponent(App);
