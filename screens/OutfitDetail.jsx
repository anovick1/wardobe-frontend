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
import { useOutfits } from "../contexts/OutfitContext";
import { dataManager } from "../services/DataManager";
import api from "../api";
import { SafeAreaView } from "react-native-safe-area-context";

const OutfitDetail = () => {
  let route;
  let routeParams = {};
  let navigation;

  try {
    route = useRoute();
    navigation = useNavigation();
    routeParams = route?.params || {};
  } catch (error) {
    console.error("Navigation context error:", error);
    routeParams = {};
    // Return early if navigation context is broken
    return (
      <SafeAreaView
        style={styles.errorContainer}
        edges={["top", "left", "right"]}
      >
        <Text style={styles.errorText}>
          Navigation error. Please restart the app.
        </Text>
      </SafeAreaView>
    );
  }

  const {
    outfit: initialOutfit,
    outfitId: paramOutfitId,
    fromHome,
  } = routeParams;
  const [outfit, setOutfit] = useState(null);
  const outfitId = initialOutfit?.id || paramOutfitId;
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const { removeOutfit, addOutfit } = useOutfits();

  const fetchOutfitDetails = async () => {
    if (!user || !outfitId) return;
    try {
      setLoading(true);
      const response = await api.get(`/outfits/${outfitId}?include_items=true`);
      setOutfit(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load outfit details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAndEdit = async () => {
    try {
      const copyResult = await dataManager.copyOutfit(outfitId);
      Alert.alert("Success", "Outfit copied successfully!", [
        {
          text: "Edit Copy",
          onPress: () =>
            navigation.navigate("EditOutfit", {
              outfitId: copyResult.outfit.id,
            }),
        },
        {
          text: "View Copy",
          onPress: () =>
            navigation.navigate("OutfitDetail", {
              outfit: copyResult.outfit,
            }),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to copy outfit");
      console.error(error);
    }
  };

  // Always fetch to get complete data including wardrobe items
  useEffect(() => {
    if (user && outfitId) {
      fetchOutfitDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, outfitId]);

  // TODO: Add selective refetch when returning from EditOutfit if needed
  // useFocusEffect removed to prevent API spam

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
              removeOutfit(outfitId);
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

  if (loading && !outfit) {
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
    <SafeAreaView
      style={{ backgroundColor: "#fff", flex: 1 }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (fromHome) {
                navigation.navigate("Outfits");
              } else {
                navigation.goBack();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            pointerEvents="auto"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title} pointerEvents="none">
            Outfit Details
          </Text>
          <View style={styles.headerActions} pointerEvents="box-none">
            {outfit?.is_daily_outfit ? (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyAndEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                pointerEvents="auto"
              >
                <Ionicons name="copy" size={24} color="#007AFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditOutfit", { outfit })}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                pointerEvents="auto"
              >
                <Ionicons name="pencil" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
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
          {/* Outfit Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.outfitTitle}>
              {outfit.title || "Untitled Outfit"}
            </Text>
            <Text style={styles.itemCount}>
              {outfit.wardrobe_items?.length || 0}{" "}
              {(outfit.wardrobe_items?.length || 0) === 1 ? "item" : "items"}
            </Text>
          </View>

          {/* Outfit Composite Image */}
          <View style={styles.outfitImageContainer}>
            {outfit.composite_image_url || outfit.composite_image_url ? (
              <Image
                source={{
                  uri: outfit.composite_image_url || outfit.composite_image_url,
                }}
                style={styles.outfitImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="image-outline" size={80} color="#ccc" />
                <Text style={styles.placeholderText}>No outfit image</Text>
              </View>
            )}
          </View>

          {/* AI Explanation (if available) */}
          {outfit.explanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationLabel}>AI Stylist Notes</Text>
              <Text style={styles.explanationText}>{outfit.explanation}</Text>
            </View>
          )}

          {/* Notes */}
          {outfit.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{outfit.notes}</Text>
            </View>
          )}

          {/* Wardrobe Items Carousel */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsSectionLabel}>Items in this outfit</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsCarousel}
            >
              {(outfit.wardrobe_items || []).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    { marginLeft: index === 0 ? 0 : 12 },
                  ]}
                  onPress={() =>
                    navigation.navigate("WardrobeItemDetail", { item })
                  }
                >
                  <Image
                    source={{
                      uri: item.composite_image_url || item.image_url,
                    }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.brand && (
                      <Text style={styles.itemBrand} numberOfLines={1}>
                        {item.brand}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tags Section */}
          {outfit.tags && outfit.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsSectionLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {outfit.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataLabel}>
              {outfit.generated_by === "chatgpt"
                ? "Created by AI"
                : "Created by You"}
            </Text>
            <Text style={styles.metadataText}>
              {new Date(outfit.created_at).toLocaleString()}
            </Text>
          </View>
        </ScrollView>
      </View>
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
  copyButton: {
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
  outfitImageContainer: {
    backgroundColor: "#fff",
    margin: 16,
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
  outfitImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f8f9fa",
  },
  placeholderContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  metadataContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  metadataLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 14,
    color: "#666",
  },
  explanationContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  explanationLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#007AFF",
  },
  explanationText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  notesContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
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
  itemsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  itemsSectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  itemsCarousel: {
    paddingHorizontal: 16,
  },
  itemCard: {
    width: 120,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  itemInfo: {
    padding: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 10,
    color: "#666",
  },
  titleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  outfitTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  tagsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  tagsSectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: "#666",
  },
});

export default OutfitDetail;
