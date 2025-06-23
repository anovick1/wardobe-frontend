import React, { useCallback } from "react";
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
import useCachedImage from "../hooks/useCachedImage";
import { useOutfits } from "../contexts/OutfitContext";
import api from "../api";

// Cached outfit item component for optimized image loading
const OutfitItemWithCache = ({ item, onPress, onDelete }) => {
  const { uri, loading, error } = useCachedImage(
    item.composite_image_url,
    `outfit-${item.id}`
  );

  // Determine outfit type and corresponding icon/badge
  const isDailyOutfit = item.is_daily_outfit;
  const isAIGenerated = item.generated_by === "chatgpt" && !isDailyOutfit;
  const isUserGenerated = item.generated_by === "manual";

  const getOutfitTypeInfo = () => {
    if (isDailyOutfit) {
      return {
        icon: "calendar",
        text: "Daily",
        color: "#FF6B6B",
        backgroundColor: "#FFE8E8",
      };
    } else if (isAIGenerated) {
      return {
        icon: "sparkles",
        text: "AI",
        color: "#4ECDC4",
        backgroundColor: "#E8FFFE",
      };
    } else {
      return {
        icon: "person",
        text: "Manual",
        color: "#45B7D1",
        backgroundColor: "#E8F4FD",
      };
    }
  };

  const typeInfo = getOutfitTypeInfo();

  return (
    <TouchableOpacity style={styles.outfitCard} onPress={onPress}>
      <View style={styles.outfitImages}>
        {item.composite_image_url && (
          <>
            {loading ? (
              <View
                style={[
                  styles.outfitImage,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <ActivityIndicator size="small" />
              </View>
            ) : error ? (
              <View
                style={[
                  styles.outfitImage,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Ionicons name="alert-circle" size={24} color="#dc2626" />
              </View>
            ) : (
              <Image
                source={{ uri }}
                style={styles.outfitImage}
                resizeMode="contain"
              />
            )}
          </>
        )}
      </View>
      <View style={styles.outfitInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.outfitTitle}>
            {item.title || "Untitled Outfit"}
          </Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeInfo.backgroundColor },
            ]}
          >
            <Ionicons name={typeInfo.icon} size={12} color={typeInfo.color} />
            <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
              {typeInfo.text}
            </Text>
          </View>
        </View>
        <Text style={styles.outfitItems}>
          {item.item_count} {item.item_count === 1 ? "item" : "items"}
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={24} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const OutfitsScreen = () => {
  const navigation = useNavigation();
  const {
    outfits,
    loadingOutfits,
    currentPage,
    totalPages,
    removeOutfit,
    loadMoreOutfits,
    refreshOutfits,
  } = useOutfits();

  const handleDeleteOutfit = useCallback(
    async (outfitId) => {
      try {
        await api.delete(`/outfits/${outfitId}`);
        removeOutfit(outfitId);
      } catch (error) {
        console.error("Failed to delete outfit:", error);
        Alert.alert("Error", "Failed to delete outfit");
      }
    },
    [removeOutfit]
  );

  const renderOutfitItem = useCallback(
    ({ item }) => (
      <OutfitItemWithCache
        item={item}
        onPress={() => navigation.navigate("OutfitDetail", { outfit: item })}
        onDelete={() => handleDeleteOutfit(item.id)}
      />
    ),
    [navigation, handleDeleteOutfit]
  );

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !loadingOutfits) {
      loadMoreOutfits();
    }
  }, [currentPage, totalPages, loadingOutfits, loadMoreOutfits]);

  if (loadingOutfits && outfits.length === 0) {
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
        refreshing={loadingOutfits && outfits.length > 0}
        onRefresh={refreshOutfits}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No outfits yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreateOutfit")}
            >
              <Text style={styles.createButtonText}>
                Create Your First Outfit
              </Text>
            </TouchableOpacity>
          </View>
        }
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  outfitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 50,
    justifyContent: "center",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 3,
  },
  outfitItems: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default OutfitsScreen;
