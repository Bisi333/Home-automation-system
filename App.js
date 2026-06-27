import React, { useContext, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { AppProvider, AppContext } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// --- Premium Custom Blue & White MD3 Themes ---
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0061A4', // Deep IoT Blue
    primaryContainer: '#D1E4FF', // Soft ice-blue highlight
    onPrimaryContainer: '#001D36',
    background: '#F8F9FD', // Modern off-white background
    surface: '#FFFFFF',
    onSurface: '#1A1C1E',
    outline: '#74777F',
    outlineVariant: '#E0E2EC', // Clean boundary lines
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#F1F4F9', // Card backdrop
      level2: '#EBF0F6', // Header backdrop
    }
  }
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A5C8FF', // Radiant Electric Blue
    primaryContainer: '#00487D', // Sleek dark steel blue
    onPrimaryContainer: '#D1E4FF',
    background: '#0D1115', // Premium dark-space background
    surface: '#15191E', // Slate card surface
    onSurface: '#E2E2E6',
    outline: '#8D9199',
    outlineVariant: '#2E333D', // Charcoal lines
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#1B2026', // Elevated Card
      level2: '#222830', // Elevated Header
    }
  }
};

function MainAppContent() {
  const { user, settings } = useContext(AppContext);
  const [currentScreen, setCurrentScreen] = useState('DASHBOARD'); // DASHBOARD, SETTINGS

  // Determine current active theme
  const activeTheme = settings.darkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={activeTheme}>
      <SafeAreaProvider>
        <StatusBar style={settings.darkMode ? 'light' : 'dark'} />
        
        {!user ? (
          <LoginScreen />
        ) : currentScreen === 'SETTINGS' ? (
          <SettingsScreen onBack={() => setCurrentScreen('DASHBOARD')} />
        ) : (
          <DashboardScreen onOpenSettings={() => setCurrentScreen('SETTINGS')} />
        )}
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
