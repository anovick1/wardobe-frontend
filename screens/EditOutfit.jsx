import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalTagInput from "../components/common/ModalTagInput";
import TagsPreview from "../components/itemReview/TagsPreview";
import { AuthContext } from "../auth/AuthContext";
import { useOutfits } from "../contexts/OutfitContext";
import { useWardrobe } from "../contexts/WardrobeContext";
import api from "../api";
import * as FileSystem from "expo-file-system";
import { validateOutfitCategories, getOutfitValidationMessage } from "../utils/outfitValidation";

const EditOutfit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { outfit: initialOutfit, outfitId } = route.params || {};
  const { user } = useContext(AuthContext);
  const { updateOutfit, getOutfitById } = useOutfits();
  const { wardrobeItems, fetchWardrobeItems } = useWardrobe();

  const [outfit, setOutfit] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notesHeight, setNotesHeight] = useState(100);

  const loadOutfitData = async () => {
    setLoading(true);

    try {
      let outfitData = initialOutfit;

      // If we don't have outfit data but have an ID, fetch it
      if (!outfitData && outfitId) {
        console.log("Fetching outfit by ID:", outfitId);
        outfitData = await getOutfitById(outfitId);
        if (!outfitData) {
          Alert.alert("Error", "Outfit not found");
          navigation.goBack();
          return;
        }
      }

      // Ensure we have the first page of wardrobe items
      if (!wardrobeItems || wardrobeItems.length === 0) {
        await fetchWardrobeItems(1, false);
      }

      let allAvailableItems = wardrobeItems || [];

      // Set outfit data in state and form fields
      if (outfitData) {
        console.log("Setting outfit data:", outfitData);
        setOutfit(outfitData);
        setTitle(outfitData.title || "");
        setNotes(outfitData.notes || "");
        setTags(outfitData.tags || []);

        // If we have an outfit, check if all selected items are available
        if (outfitData?.wardrobe_items) {
          const selectedItemIds = outfitData.wardrobe_items.map(
            (item) => item.id
          );
          console.log("Setting selected items:", selectedItemIds);
          setSelectedItems(selectedItemIds);

          const missingItems = selectedItemIds.filter(
            (id) => !allAvailableItems.find((item) => item.id === id)
          );

          // Fetch missing items individually
          if (missingItems.length > 0) {
            console.log("Fetching missing items:", missingItems);
            const missingItemPromises = missingItems.map((id) =>
              api.get(`/wardrobe_items/${id}`).then((response) => response.data)
            );

            try {
              const fetchedMissingItems = await Promise.all(
                missingItemPromises
              );
              allAvailableItems = [
                ...allAvailableItems,
                ...fetchedMissingItems,
              ];
              console.log("Fetched missing items:", fetchedMissingItems);
            } catch (error) {
              console.error("Error fetching missing items:", error);
            }
          }
        }
      }

      setAllItems(allAvailableItems);
    } catch (error) {
      console.error("Error loading outfit data:", error);
      Alert.alert("Error", "Failed to load outfit data");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreWardrobeItems = async () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      try {
        const response = await api.get(
          `/wardrobe_items?page=${currentPage + 1}`
        );
        const items = response.data?.wardrobe_items || [];
        const pagination = response.data?.pagination || {};

        setAllItems((prev) => [...prev, ...items]);
        setHasMore(pagination.has_next || false);
        setCurrentPage((prev) => prev + 1);
      } catch (error) {
        console.error("Error loading more items:", error);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 20;

    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      loadMoreWardrobeItems();
    }
  };

  useEffect(() => {
    if (user && (initialOutfit || outfitId)) {
      loadOutfitData();
    }
  }, [user, initialOutfit, outfitId]);

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const invalidateOutfitImageCache = async (outfitId) => {
    try {
      // Try multiple cache path variations that might be used
      const cachePaths = [
        `${FileSystem.cacheDirectory}wardrobe-${outfitId}.jpg`,
        `${FileSystem.cacheDirectory}wardrobe-${outfitId}.png`,
        `${FileSystem.cacheDirectory}outfit-${outfitId}.jpg`,
        `${FileSystem.cacheDirectory}outfit-${outfitId}.png`,
      ];

      let deletedCount = 0;
      for (const cachePath of cachePaths) {
        try {
          const info = await FileSystem.getInfoAsync(cachePath);
          if (info.exists) {
            await FileSystem.deleteAsync(cachePath);
            deletedCount++;
            console.log("Deleted cached image:", cachePath);
          }
        } catch (pathError) {
          // Continue to next path if this one fails
        }
      }

      console.log(
        `Invalidated ${deletedCount} cached images for outfit ${outfitId}`
      );

      // Also try to clear the entire cache directory for this outfit
      // This is more aggressive but ensures the image refreshes
      try {
        const cacheDir = FileSystem.cacheDirectory;
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        const outfitFiles = files.filter(
          (file) =>
            file.includes(outfitId) || file.includes(`wardrobe-${outfitId}`)
        );

        for (const file of outfitFiles) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`);
          console.log("Deleted outfit cache file:", file);
        }
      } catch (dirError) {
        console.log("Could not clear cache directory:", dirError.message);
      }
    } catch (error) {
      console.error("Error invalidating outfit image cache:", error);
    }
  };

  const handleSaveOutfit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your outfit");
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one item for your outfit");
      return;
    }

    // Validate outfit category requirements
    const selectedItemsData = allItems.filter(item => selectedItems.includes(item.id));
    const validation = validateOutfitCategories(selectedItemsData);
    
    if (!validation.isValid) {
      Alert.alert("Invalid Outfit", getOutfitValidationMessage(validation));
      return;
    }

    setSaving(true);
    try {
      const currentOutfitId = outfit?.id || initialOutfit?.id || outfitId;
      const response = await api.put(`/outfits/${currentOutfitId}`, {
        title: title.trim(),
        wardrobe_item_ids: selectedItems,
        notes: notes.trim(),
        tags: tags,
      });

      const updatedOutfit = {
        ...outfit,
        id: currentOutfitId,
        title: title.trim(),
        notes: notes.trim(),
        tags: tags,
        wardrobe_items: allItems.filter((item) =>
          selectedItems.includes(item.id)
        ),
        item_count: selectedItems.length,
        composite_image_url:
          response.data.composite_image_url || outfit?.composite_image_url,
        composite_image_updated: response.data.composite_image_updated,
      };

      // Invalidate the outfit image cache since we regenerated the composite image
      if (response.data.composite_image_updated) {
        await invalidateOutfitImageCache(currentOutfitId);
      }

      if (updateOutfit) {
        updateOutfit(updatedOutfit);
      }

      Alert.alert("Success", "Outfit updated successfully");
      navigation.navigate("WardrobeHome", { initialTab: "Outfits" });
    } catch (error) {
      Alert.alert("Error", "Failed to update outfit");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#121416" />
        <Text style={{ marginTop: 10 }}>Loading outfit...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ backgroundColor: "#fff", flex: 1 }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Outfit</Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveOutfit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          <View style={styles.formContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter outfit title..."
              placeholderTextColor="#6a7681"
            />

            <Text style={[styles.label, { marginTop: 20 }]}>
              Tags (optional)
            </Text>
            <TouchableOpacity
              style={styles.tagsField}
              onPress={() => setTagModalVisible(true)}
            >
              <TagsPreview tags={tags} />
              <Ionicons name="chevron-forward" size={20} color="#6a7681" />
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 20 }]}>
              Notes (optional)
            </Text>
            <TextInput
              style={[styles.notesInput, { height: notesHeight }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this outfit..."
              placeholderTextColor="#6a7681"
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
              onContentSizeChange={(event) =>
                setNotesHeight(
                  Math.max(
                    100,
                    Math.min(200, event.nativeEvent.contentSize.height + 16)
                  )
                )
              }
            />
          </View>

          <View style={styles.itemsContainer}>
            <Text style={styles.label}>
              Selected Items ({selectedItems.length})
            </Text>
            <View style={styles.selectedItemsContainer}>
              {selectedItems.map((itemId) => {
                const item = allItems.find((i) => i.id === itemId);
                if (!item) return null;
                return (
                  <View key={itemId} style={styles.selectedItemCard}>
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.selectedItemImage}
                      resizeMode="contain"
                    />
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName}>{item.name}</Text>
                      <Text style={styles.selectedItemBrand}>{item.brand}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => toggleItemSelection(itemId)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ff3b30" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>
              Add More Items
            </Text>
            <View style={styles.itemsGrid}>
              {allItems
                .filter((item) => !selectedItems.includes(item.id))
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => toggleItemSelection(item.id)}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.itemImage}
                      resizeMode="contain"
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemBrand} numberOfLines={1}>
                        {item.brand}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>

            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#121416" />
                <Text style={styles.loadingMoreText}>
                  Loading more items...
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <ModalTagInput
          visible={tagModalVisible}
          onClose={() => setTagModalVisible(false)}
          title="Outfit Tags"
          tags={tags}
          onSave={setTags}
          placeholder="Add outfit tag..."
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#121416",
    letterSpacing: -0.5,
  },
  saveButton: {
    backgroundColor: "#121416",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#121416",
    backgroundColor: "#f8fafc",
    fontFamily: "System",
    fontWeight: "500",
  },
  tagsField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
    minHeight: 50,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#121416",
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#f8fafc",
    fontFamily: "System",
  },
  itemsContainer: {
    paddingHorizontal: 20,
  },
  selectedItemsContainer: {
    marginBottom: 24,
  },
  selectedItemCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  selectedItemImage: {
    width: 88,
    height: 88,
    backgroundColor: "#f8fafc",
  },
  selectedItemInfo: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  selectedItemBrand: {
    fontSize: 14,
    color: "#6a7681",
    fontWeight: "500",
  },
  removeItemButton: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  itemCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f8fafc",
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  itemBrand: {
    fontSize: 12,
    color: "#6a7681",
    fontWeight: "500",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 10,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6a7681",
    fontWeight: "500",
  },
});

export default EditOutfit;
