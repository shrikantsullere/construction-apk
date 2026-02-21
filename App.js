import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigation from './src/navigation/AppNavigation';
import { AppProvider } from './src/context/AppContext';
import SplashScreen from './src/screens/auth/SplashScreen';

// Paper theme (minimal — just to avoid import error)
const paperTheme = {
    version: 3,
    colors: { primary: '#1D4ED8' },
};

export default function App() {
    const [splashDone, setSplashDone] = useState(false);

    if (!splashDone) {
        return (
            <>
                <StatusBar style="light" />
                <SplashScreen onFinish={() => setSplashDone(true)} />
            </>
        );
    }

    return (
        <SafeAreaProvider>
            <AppProvider>
                <PaperProvider theme={paperTheme}>
                    <StatusBar style="light" />
                    <AppNavigation />
                </PaperProvider>
            </AppProvider>
        </SafeAreaProvider>
    );
}
