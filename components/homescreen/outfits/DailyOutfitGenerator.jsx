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
  const { weather } = useWeather();

  const handleGenerateDailyOutfit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to generate outfits.");
      return;
    }

    setGeneratingDaily(true);
    try {
      const wardrobeResponse = await api.get("wardrobe_items");
      const wardrobe = wardrobeResponse.data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.primary_color,
        tags: item.tags,
        image_url: item.image_url,
      }));

      if (wardrobe.length === 0) {
        Alert.alert(
          "Error",
          "You need items in your wardrobe to generate an outfit."
        );
        setGeneratingDaily(false);
        return;
      }

      const payload = {
        wardrobe: wardrobe,
        weather: weather,
        calendar_events: [],
        focus_type: "daily",
        daily_routine: "typical daily activities",
      };

      const response = await api.post("/outfits/ai_generate", payload);
      Alert.alert("Success", response.data.message);
      navigation.navigate("Outfits");
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
        style={[
          styles.dailyGenerateButton,
          generatingDaily && styles.dailyGenerateButtonDisabled,
        ]}
        onPress={handleGenerateDailyOutfit}
        disabled={generatingDaily}
      >
        {generatingDaily ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.dailyGenerateButtonText}>
            Generate Daily Outfit
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  dailyGenerateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dailyGenerateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dailyGenerateButtonDisabled: {
    opacity: 0.5,
  },
});

export default DailyOutfitGenerator;
