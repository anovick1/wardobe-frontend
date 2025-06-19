import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../../auth/AuthContext";
import { useWeather } from "../../../contexts/WeatherContext";
import api from "../../../api";

const DailyOutfitGenerator = () => {
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { weather, city } = useWeather();

  const handleGenerateDailyOutfit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to generate outfits.");
      return;
    }

    setGeneratingDaily(true);
    try {
      let prompt = "Generate my daily outfit for today.";
      if (weather && city) {
        prompt = `Generate my daily outfit for today in ${city} with weather: ${weather.temperature}°C, ${weather.weather_description || ''}`;
      } else if (city) {
        prompt = `Generate my daily outfit for today in ${city}.`;
      } else if (weather) {
        prompt = `Generate my daily outfit for today with weather: ${weather.temperature}°C, ${weather.weather_description || ''}`;
      }

      const response = await api.post("/outfits/ai_generate_hybrid", {
        prompt,
      });

      const { outfit } = response.data;

      Alert.alert("Success", response.data.message || "Outfit generated!");
      navigation.reset({
        index: 1,
        routes: [
          { name: "Outfits" },
          { name: "OutfitDetail", params: { outfitId: outfit.id, fromHome: true } }
        ]
      });
    } catch (error) {
      console.error(
        "Error generating daily outfit:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to generate daily outfit."
      );
    } finally {
      setGeneratingDaily(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleGenerateDailyOutfit}
        disabled={generatingDaily}
      >
        {generatingDaily ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={styles.cardText}>Generate Daily Outfit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles for the container if needed
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    marginHorizontal: 16,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#121416",
  },
});

export default DailyOutfitGenerator;
