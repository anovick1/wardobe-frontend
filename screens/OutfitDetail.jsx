import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import api from "../api";
import { SafeAreaView } from "react-native-safe-area-context";

const OutfitDetail = () => {
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { outfitId } = route.params;

  const fetchOutfitDetails = async () => {
    try {
      const response = await api.get(`/outfits/${outfitId}`);
      setOutfit(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load outfit details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOutfitDetails();
    }
  }, [user]);

  const handleDeleteOutfit = async () => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/outfits/${outfitId}`);
              Alert.alert("Success", "Outfit deleted successfully");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete outfit");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={["top", "left", "right"]}
      >
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (!outfit) {
    return (
      <SafeAreaView
        style={styles.errorContainer}
        edges={["top", "left", "right"]}
      >
        <Text style={styles.errorText}>Outfit not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          pointerEvents="auto"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title} pointerEvents="none">
          Outfit Details
        </Text>
        <View style={styles.headerActions} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditOutfit", { outfitId })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            pointerEvents="auto"
          >
            <Ionicons name="pencil" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteOutfit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            pointerEvents="auto"
          >
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.itemsGrid}>
          {outfit.wardrobe_items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemBrand}>{item.brand}</Text>
              </View>
            </View>
          ))}
        </View>

        {outfit.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{outfit.notes}</Text>
          </View>
        )}

        <View style={styles.metadataContainer}>
          <Text style={styles.metadataLabel}>Created</Text>
          <Text style={styles.metadataText}>
            {new Date(outfit.created_at).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  editButton: {
    padding: 8,
    marginRight: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  itemsGrid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: "100%",
    height: 200,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 14,
    color: "#666",
  },
  notesContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  metadataContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 16,
  },
  metadataLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    color: "#666",
  },
});

export default OutfitDetail;
