import { useState, useEffect, useCallback } from "react";
import api from "../../../api";
import { mapEventsForApi } from "../../../utils/events";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOutfits } from "../../../contexts/OutfitContext";

export const useDailyOutfit = (lat, lon, events) => {
  const [dailyOutfit, setDailyOutfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [initialising, setInitialising] = useState(true);

  // Get outfit context functions
  const { addOutfit, updateOutfit } = useOutfits();

  // Load cached outfit on mount
  useEffect(() => {
    const loadCached = async () => {
      const todayKey = `daily_outfit_${new Date().toISOString().slice(0, 10)}`; // YYYY-MM-DD
      try {
        const cached = await AsyncStorage.getItem(todayKey);
        if (cached) {
          setDailyOutfit(JSON.parse(cached));
        }
      } catch {
      } finally {
        setInitialising(false);
      }
    };
    loadCached();
  }, []);

  // Function to fetch today's outfit
  const fetchTodayOutfit = useCallback(async () => {
    if (!lat || !lon) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/daily_outfits/today");
      const outfitPayload = response.data?.daily_outfit || response.data;
      setDailyOutfit(outfitPayload);

      // cache
      const todayKey = `daily_outfit_${new Date().toISOString().slice(0, 10)}`;
      AsyncStorage.setItem(todayKey, JSON.stringify(outfitPayload)).catch(
        () => {}
      );

      // Add to outfit context if it has an outfit object
      if (outfitPayload?.outfit && addOutfit) {
        addOutfit(outfitPayload.outfit, true); // skipBackendCall = true since it's already from backend
      } else if (outfitPayload && outfitPayload.id && addOutfit) {
        // If the daily outfit payload itself is the outfit data, add it directly
        // Mark it as a daily outfit for proper categorization
        const outfitData = {
          ...outfitPayload,
          is_daily_outfit: true,
        };
        addOutfit(outfitData, true);
      }

      // No polling here – backend already returns the composite image URL when ready
    } catch (err) {
      if (err.response?.status === 404) {
        // No outfit exists for today, we'll need to generate one
        setError({ status: 404, message: "No outfit for today" });
      } else {
        setError({ status: err.response?.status, message: err.message });
      }
    } finally {
      setLoading(false);
      setInitialising(false);
    }
  }, [lat, lon, addOutfit]);

  // Function to generate new outfit
  const generateOutfit = useCallback(async () => {
    if (!lat || !lon || !events) return;

    try {
      setGenerating(true);
      setError(null);
      console.log("lat", lat);
      console.log("lon", lon);
      console.log("events", mapEventsForApi(events));
      const response = await api.post("/daily_outfits/generate", {
        lat,
        lon,
        events: mapEventsForApi(events),
      });

      const outfitPayload = response.data?.daily_outfit || response.data;
      setDailyOutfit(outfitPayload);

      // cache
      const todayKey = `daily_outfit_${new Date().toISOString().slice(0, 10)}`;
      AsyncStorage.setItem(todayKey, JSON.stringify(outfitPayload)).catch(
        () => {}
      );

      // Add to outfit context if it has an outfit object
      if (outfitPayload?.outfit && addOutfit) {
        addOutfit(outfitPayload.outfit, true); // skipBackendCall = true since it's already from backend
      } else if (outfitPayload && outfitPayload.id && addOutfit) {
        // If the daily outfit payload itself is the outfit data, add it directly
        // Mark it as a daily outfit for proper categorization
        const outfitData = {
          ...outfitPayload,
          is_daily_outfit: true,
        };
        addOutfit(outfitData, true);
      }

      // Backend will return the composite image URL once generation is done – no polling
    } catch (err) {
      setError({ status: err.response?.status, message: err.message });
    } finally {
      setGenerating(false);
      setInitialising(false);
    }
  }, [lat, lon, events, addOutfit]);

  // Initial fetch when coordinates are available
  useEffect(() => {
    if (lat && lon) {
      fetchTodayOutfit();
    }
  }, [lat, lon, fetchTodayOutfit]);

  // Auto-generate if 404 and events are ready
  useEffect(() => {
    if (
      error?.status === 404 &&
      !generating &&
      events &&
      events.length >= 0 &&
      lat &&
      lon
    ) {
      generateOutfit();
    }
  }, [error, generating, events, lat, lon, generateOutfit]);

  return {
    dailyOutfit,
    loading,
    error,
    generating,
    initialising,
    generateOutfit, // For "New Look" button
    refetch: fetchTodayOutfit,
  };
};
