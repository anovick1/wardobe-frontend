import React, { createContext, useContext, useEffect, useState } from "react";
import * as Location from "expo-location";
import api from "../api"; // ✅ use the preconfigured Axios instance

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        console.log("📡 Weather request via API:", {
          lat: latitude,
          lon: longitude,
        });

        const res = await api.post("/weather", {
          lat: latitude,
          lon: longitude,
        });
      } catch (err) {
        console.error("❌ Weather fetch failed:", err);
        setError("Weather fetch failed");
      }
    })();
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, error }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => useContext(WeatherContext);
