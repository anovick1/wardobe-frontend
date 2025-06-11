import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import api from "../api";
import { useWeather } from "../contexts/WeatherContext";

const OutfitsScreen = () => {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { weather } = useWeather();
  console.log("🔍 Weather:", weather);

  const fetchOutfits = async () => {
    try {
      const response = await api.get("/outfits/");
      setOutfits(response.data);
    } catch (error) {
      console.error("Failed to fetch outfits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOutfits();
    }
  }, [user]);

  const handleDeleteOutfit = async (outfitId) => {
    try {
      await api.delete(`/outfits/${outfitId}`);
      setOutfits((prevOutfits) =>
        prevOutfits.filter((outfit) => outfit.id !== outfitId)
      );
    } catch (error) {
      console.error("Failed to delete outfit:", error);
    }
  };

  const handleGenerateDailyOutfit = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to generate outfits.");
      return;
    }

    setGeneratingDaily(true);
    try {
      const wardrobeResponse = await api.get("/wardrobe_items");
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
        weather: weather, // Placeholder for daily
        calendar_events: [], // Placeholder for daily
        focus_type: "daily",
        daily_routine: "typical daily activities", // Placeholder
      };

      const response = await api.post("/outfits/ai_generate", payload);
      Alert.alert("Success", response.data.message);
      fetchOutfits(); // Refresh outfits after generating
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

  const renderOutfitItem = ({ item }) => (
    <TouchableOpacity
      style={styles.outfitCard}
      onPress={() => navigation.navigate("OutfitDetail", { outfitId: item.id })}
    >
      <View style={styles.outfitImages}>
        {item.wardrobe_items.slice(0, 3).map((wardrobeItem, index) => (
          <Image
            key={wardrobeItem.id}
            source={{ uri: wardrobeItem.image_url }}
            style={[
              styles.outfitImage,
              { zIndex: 3 - index },
              index > 0 && { marginLeft: -20 },
            ]}
          />
        ))}
      </View>
      <View style={styles.outfitInfo}>
        <Text style={styles.outfitName}>{item.name}</Text>
        <Text style={styles.outfitDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteOutfit(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Outfits</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => navigation.navigate("GenerateOutfit")}
          >
            <Ionicons name="sparkles" size={24} color="#007AFF" />
            <Text style={styles.generateButtonText}>AI Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("CreateOutfit")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

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

      <FlatList
        data={outfits}
        renderItem={renderOutfitItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    zIndex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  dailyGenerateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  dailyGenerateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dailyGenerateButtonDisabled: {
    opacity: 0.5,
  },
  listContainer: {
    padding: 16,
  },
  outfitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outfitImages: {
    flexDirection: "row",
    marginRight: 16,
  },
  outfitImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
  },
  outfitInfo: {
    flex: 1,
  },
  outfitName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  outfitDate: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
  },
});

export default OutfitsScreen;
