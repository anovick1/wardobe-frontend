import React, { createContext, useContext, useEffect, useState } from "react";
import * as Location from "expo-location";
import api from "../api"; // ✅ use the preconfigured Axios instance

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [city, setCity] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

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

        // Store coordinates
        setCoordinates({ lat: latitude, lon: longitude });

        // Reverse geocode to get city
        const placemarks = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (placemarks && placemarks.length > 0) {
          setCity(
            placemarks[0].city ||
              placemarks[0].region ||
              placemarks[0].country ||
              null
          );
        }

        // Only make the request if both are valid numbers
        if (typeof latitude === "number" && typeof longitude === "number") {
          const res = await api.post("/weather/realtime", {
            lat: latitude,
            lon: longitude,
          });
          setWeather(res.data);
        } else {
          setError("Invalid location data");
        }
      } catch (err) {
        console.error("❌ Weather fetch failed:", err.response?.data || err);
        setError("Weather fetch failed");
      }
    })();
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, error, city, coordinates }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => useContext(WeatherContext);
