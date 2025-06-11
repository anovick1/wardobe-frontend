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

const OutfitsScreen = () => {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

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
