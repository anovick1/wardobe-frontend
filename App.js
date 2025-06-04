import React, { useContext } from "react";
import { AuthProvider, AuthContext } from "./auth/AuthContext";
import { WeatherProvider } from "./contexts/WeatherContext"; // ✅ NEW
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import { StatusBar } from "expo-status-bar";

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  console.log("🧠 AppContent state →", { loading, user });

  if (loading) return null;
  return user ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <WeatherProvider>
        {/* ✅ Wrap in weather context */}
        <AppContent />
        <StatusBar style="auto" />
      </WeatherProvider>
    </AuthProvider>
  );
}
