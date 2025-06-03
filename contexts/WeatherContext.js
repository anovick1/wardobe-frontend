import React, { createContext, useContext, useEffect, useState } from "react";
import * as Location from "expo-location";
import axios from "axios";

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

        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_FLASK_API_BASE_URL}/weather`,
          { lat: latitude, lon: longitude }
        );

        setWeather(res.data);
      } catch (err) {
        console.error("Weather fetch failed:", err);
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
