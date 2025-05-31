// App.js
import React, { useContext } from "react";
import { AuthProvider, AuthContext } from "./auth/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import { StatusBar } from "expo-status-bar";

function AppContent() {
  const { user, loading } = useContext(AuthContext);

  console.log("🔁 user in AppContent:", user?.email); // <-- should print after login

  if (loading) return null; // or a splash screen

  return user ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
