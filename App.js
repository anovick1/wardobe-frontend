import React, { useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, AuthContext } from "./auth/AuthContext";
import { WeatherProvider } from "./contexts/WeatherContext";
import { WardrobeProvider } from "./contexts/WardrobeContext"; // ✅ Add this line
import LoginScreen from "./screens/LoginScreen";
import RootNavigator from "./navigation/RootNavigator";

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  // console.log("🧠 AppContent state →", { loading, user });

  if (loading) return null;

  return user ? <RootNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <WeatherProvider>
        <WardrobeProvider>
          <AppContent />
          <StatusBar style="auto" />
        </WardrobeProvider>
      </WeatherProvider>
    </AuthProvider>
  );
}
