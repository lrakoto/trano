import React, { useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SavedProvider } from './src/context/SavedContext';
import { DrawerProvider } from './src/context/DrawerContext';
import { DrawerOverlay } from './src/components/DrawerOverlay';
import { RootNavigator } from './src/navigation';
import type { RootStackParamList } from './src/navigation';

const navRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SavedProvider>
        <DrawerProvider>
          <NavigationContainer ref={navRef}>
            <RootNavigator />
            {/* DrawerOverlay inside NavigationContainer — same view tree as app content */}
            <DrawerOverlay navRef={navRef} />
          </NavigationContainer>
        </DrawerProvider>
        </SavedProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
