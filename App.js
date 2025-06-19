import React, { useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, AuthContext } from "./auth/AuthContext";
import { WeatherProvider } from "./contexts/WeatherContext";
import { WardrobeProvider } from "./contexts/WardrobeContext";
import { OutfitProvider } from "./contexts/OutfitContext";
import LoginScreen from "./screens/LoginScreen";
import RootNavigator from "./navigation/RootNavigator";

function AppContent() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return user ? <RootNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <WeatherProvider>
        <WardrobeProvider>
          <OutfitProvider>
            <AppContent />
            <StatusBar style="auto" />
          </OutfitProvider>
        </WardrobeProvider>
      </WeatherProvider>
    </AuthProvider>
  );
}
