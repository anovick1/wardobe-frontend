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
  const [currentVariant, setCurrentVariant] = useState(1);
  const [allVariants, setAllVariants] = useState([]);

  // Get outfit context functions
  const { addOutfit, updateOutfit } = useOutfits();

  // Helper function to get today's cache key
  const getTodayKey = useCallback((variant = 1) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return variant === 1
      ? `daily_outfit_${today}`
      : `daily_outfit_${today}_variant_${variant}`;
  }, []);

  // Load cached outfit on mount
  useEffect(() => {
    const loadCached = async () => {
      const todayKey = getTodayKey();
      try {
        const cached = await AsyncStorage.getItem(todayKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setDailyOutfit(parsed);
          setCurrentVariant(parsed.variant || 1);
        }
      } catch {
      } finally {
        setInitialising(false);
      }
    };
    loadCached();
  }, [getTodayKey]);

  // Function to fetch today's outfit with optional variant
  const fetchTodayOutfit = useCallback(
    async (variant = 1) => {
      if (!lat || !lon) return;

      try {
        setLoading(true);
        setError(null);

        const url =
          variant === 1
            ? "/daily_outfits/today"
            : `/daily_outfits/today?variant=${variant}`;
        const response = await api.get(url);
        const outfitPayload = response.data?.daily_outfit || response.data;

        // Add variant info if not present
        const outfitWithVariant = {
          ...outfitPayload,
          variant: variant,
        };

        setDailyOutfit(outfitWithVariant);
        setCurrentVariant(variant);

        // cache
        const todayKey = getTodayKey(variant);
        AsyncStorage.setItem(todayKey, JSON.stringify(outfitWithVariant)).catch(
          () => {}
        );

        // Add to outfit context if it has an outfit object
        if (outfitWithVariant?.outfit && addOutfit) {
          addOutfit(outfitWithVariant.outfit, true); // skipBackendCall = true since it's already from backend
        } else if (
          outfitWithVariant &&
          outfitWithVariant.outfit_id &&
          addOutfit
        ) {
          // If the daily outfit payload has outfit_id, create proper outfit data
          // Mark it as a daily outfit for proper categorization
          const outfitData = {
            id: outfitWithVariant.outfit_id, // Use the actual outfit ID
            title: outfitWithVariant.title,
            explanation: outfitWithVariant.explanation,
            tags: outfitWithVariant.tags,
            composite_image_url: outfitWithVariant.composite_image_url,
            is_daily_outfit: true,
            daily_outfit_id: outfitWithVariant.id, // Store the daily outfit ID for reference
            variant: outfitWithVariant.variant,
          };
          addOutfit(outfitData, true);
        }

        // No polling here – backend already returns the composite image URL when ready
      } catch (err) {
        if (err.response?.status === 404) {
          // No outfit exists for today/variant, we'll need to generate one
          setError({
            status: 404,
            message: `No outfit for today${
              variant > 1 ? ` (variant ${variant})` : ""
            }`,
          });
        } else {
          setError({ status: err.response?.status, message: err.message });
        }
      } finally {
        setLoading(false);
        setInitialising(false);
      }
    },
    [lat, lon, addOutfit, getTodayKey]
  );

  // Function to generate new outfit with optional variant
  const generateOutfit = useCallback(
    async (variant = 0) => {
      if (!lat || !lon || !events) return;

      try {
        setGenerating(true);
        setError(null);

        const localTime = new Date().toISOString(); // Includes timezone offset

        const requestBody = {
          lat,
          lon,
          local_time: localTime,
          events: mapEventsForApi(events),
        };

        // Only include variant if it's not 0 (auto-assign)
        if (variant > 0) {
          requestBody.variant = variant;
        }

        const response = await api.post("/daily_outfits/generate", requestBody);
        const outfitPayload = response.data?.daily_outfit || response.data;

        // Add variant info if not present
        const outfitWithVariant = {
          ...outfitPayload,
          variant: outfitPayload.variant || variant || 1,
        };

        setDailyOutfit(outfitWithVariant);
        setCurrentVariant(outfitWithVariant.variant);

        // cache
        const todayKey = getTodayKey(outfitWithVariant.variant);
        AsyncStorage.setItem(todayKey, JSON.stringify(outfitWithVariant)).catch(
          () => {}
        );

        // Add to outfit context if it has an outfit object
        if (outfitWithVariant?.outfit && addOutfit) {
          addOutfit(outfitWithVariant.outfit, true); // skipBackendCall = true since it's already from backend
        } else if (
          outfitWithVariant &&
          outfitWithVariant.outfit_id &&
          addOutfit
        ) {
          // If the daily outfit payload has outfit_id, create proper outfit data
          // Mark it as a daily outfit for proper categorization
          const outfitData = {
            id: outfitWithVariant.outfit_id, // Use the actual outfit ID
            title: outfitWithVariant.title,
            explanation: outfitWithVariant.explanation,
            tags: outfitWithVariant.tags,
            composite_image_url: outfitWithVariant.composite_image_url,
            is_daily_outfit: true,
            daily_outfit_id: outfitWithVariant.id, // Store the daily outfit ID for reference
            variant: outfitWithVariant.variant,
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
    },
    [lat, lon, events, addOutfit, getTodayKey]
  );

  // Function to generate the next variant for today
  const generateNewVariant = useCallback(async () => {
    if (!lat || !lon || !events) return;

    // Find the next available variant number
    const nextVariant = currentVariant + 1;
    await generateOutfit(nextVariant);
  }, [lat, lon, events, currentVariant, generateOutfit]);

  // Function to fetch all variants for today
  const fetchAllVariants = useCallback(async () => {
    if (!lat || !lon) return;

    try {
      setLoading(true);
      const response = await api.get("/daily_outfits/today?all_variants=true");
      const variants = response.data?.variants || response.data || [];
      setAllVariants(variants);

      // Cache all variants
      const today = new Date().toISOString().slice(0, 10);
      const allVariantsKey = `daily_outfits_all_${today}`;
      AsyncStorage.setItem(allVariantsKey, JSON.stringify(variants)).catch(
        () => {}
      );

      return variants;
    } catch (err) {
      console.error("Error fetching all variants:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  // Function to switch to a specific variant
  const switchToVariant = useCallback(
    async (variant) => {
      if (variant === currentVariant) return;

      // Try to load from cache first
      const todayKey = getTodayKey(variant);
      try {
        const cached = await AsyncStorage.getItem(todayKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setDailyOutfit(parsed);
          setCurrentVariant(variant);
          return;
        }
      } catch {
        // Continue to fetch from API if cache fails
      }

      // Fetch from API if not cached
      await fetchTodayOutfit(variant);
    },
    [currentVariant, getTodayKey, fetchTodayOutfit]
  );

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
    currentVariant,
    allVariants,
    generateOutfit, // For "New Look" button
    generateNewVariant, // Generate next variant
    fetchAllVariants, // Get all variants for today
    switchToVariant, // Switch to specific variant
    refetch: fetchTodayOutfit,
  };
};
