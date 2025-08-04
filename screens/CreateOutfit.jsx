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
import Icon from "react-native-vector-icons/MaterialIcons";
import ModalTagInput from "../components/common/ModalTagInput";
import TagsPreview from "../components/itemReview/TagsPreview";
import WardrobeItemPicker from "../components/wardrobe/WardrobeItemPicker";
import useCachedImage from "../hooks/useCachedImage";
import { AuthContext } from "../auth/AuthContext";
import api, { eventsAPI } from "../api";
import { useOutfits } from "../contexts/OutfitContext";
import { useWardrobe } from "../contexts/WardrobeContext";
import {
  validateOutfitCategories,
  getOutfitValidationMessage,
} from "../utils/outfitValidation";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";

const SelectedItemCard = ({ item, onRemove }) => {
  const { uri, loading, error } = useCachedImage(item.image_url, item.id);
  const navigation = useNavigation();

  const handleItemPress = () => {
    navigation.navigate("WardrobeItemDetail", { item });
  };

  return (
    <TouchableOpacity 
      style={styles.selectedItemCard}
      onPress={handleItemPress}
      activeOpacity={0.7}
    >
      <View style={styles.selectedItemImage}>
        {loading ? (
          <ActivityIndicator size="small" color="#6a7681" />
        ) : error ? (
          <Icon name="error" size={24} color="#dc2626" />
        ) : (
          <Image
            source={{ uri }}
            style={styles.selectedItemImage}
            resizeMode="contain"
          />
        )}
      </View>
      <View style={styles.selectedItemInfo}>
        <Text style={styles.selectedItemName}>{item.name || item.title}</Text>
        <Text style={styles.selectedItemBrand}>{item.brand}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeItemButton}
        onPress={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
      >
        <Ionicons name="close-circle" size={24} color="#ff3b30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const CreateOutfit = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [itemPickerVisible, setItemPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notesHeight, setNotesHeight] = useState(100);
  const [selectedItemsData, setSelectedItemsData] = useState([]);

  const navigation = useNavigation();
  const route = useRoute();
  const { selectedItem, eventId, eventTitle } = route.params || {};
  const { user } = useContext(AuthContext);
  const { addOutfit } = useOutfits();
  const { getAllWardrobeItemsForSelection } = useWardrobe();

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    title.trim() || notes.trim() || tags.length > 0 || selectedItems.length > 0;
  const { showExitWarning } = useUnsavedChangesWarning(hasUnsavedChanges);


  useEffect(() => {
    if (selectedItem) {
      setSelectedItems([selectedItem.id]);
      setSelectedItemsData([selectedItem]);
    }
  }, [selectedItem]);

  const handleItemsSelected = async (itemIds) => {
    setSelectedItems(itemIds);
    
    // Load the data for newly selected items
    try {
      const allItems = await getAllWardrobeItemsForSelection();
      const selectedData = allItems.filter((item) =>
        itemIds.includes(item.id),
      );
      setSelectedItemsData(selectedData);
    } catch (error) {
      console.error("Error loading selected items data:", error);
    }
  };

  const removeSelectedItem = (itemId) => {
    setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    setSelectedItemsData((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCreateOutfit = async () => {
    if (!title.trim()) {
      Alert.alert("Almost there!", "Give your outfit a name to save it 😊");
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert(
        "Let's build an outfit!",
        "Pick some items from your wardrobe to get started 👗",
      );
      return;
    }

    // Validate outfit category requirements
    const validation = validateOutfitCategories(selectedItemsData);

    if (!validation.isValid) {
      Alert.alert("Outfit Guidelines", getOutfitValidationMessage(validation));
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/outfits/manual_create", {
        title: title.trim(),
        wardrobe_item_ids: selectedItems,
        notes: notes.trim(),
        tags: tags,
      });

      let newOutfit = response.data?.outfit || response.data;

      // If backend returns minimal payload, fetch full outfit details to ensure all fields (title, etc.) are present
      if (newOutfit && (!newOutfit.title || !newOutfit.wardrobe_items)) {
        try {
          const fetched = await api.get(`/outfits/${newOutfit.id}`);
          newOutfit = fetched.data;
        } catch (fetchErr) {}
      }

      if (newOutfit && addOutfit) {
        addOutfit(newOutfit);
      }

      // Link to event if eventId is provided
      if (eventId && newOutfit?.id) {
        try {
          await eventsAPI.linkOutfitToEvent(eventId, newOutfit.id);
          Alert.alert("Success!", `Outfit created and linked to "${eventTitle}" ✨`);
        } catch (linkError) {
          console.error("Error linking outfit to event:", linkError);
          Alert.alert("Outfit Created!", "Outfit saved but couldn't link to event. You can link it manually later.");
        }
      } else {
        Alert.alert("Awesome!", "Your outfit has been saved to your wardrobe ✨");
      }

      navigation.navigate("Wardrobe", {
        screen: "WardrobeHome",
        params: { initialTab: "Outfits" },
      });
    } catch (error) {
      Alert.alert("Oops!", "Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: "#fff", flex: 1 }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => showExitWarning(() => navigation.goBack())}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            {eventTitle ? `Outfit for ${eventTitle}` : "Create Outfit"}
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleCreateOutfit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
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
                    Math.min(200, event.nativeEvent.contentSize.height + 16),
                  ),
                )
              }
            />
          </View>

          <View style={styles.itemsContainer}>
            <Text style={styles.label}>
              Selected Items ({selectedItems.length})
            </Text>

            {selectedItemsData.length > 0 ? (
              <View style={styles.selectedItemsContainer}>
                {selectedItemsData.map((item) => (
                  <SelectedItemCard
                    key={item.id}
                    item={item}
                    onRemove={removeSelectedItem}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No items selected yet</Text>
            )}

            <TouchableOpacity
              style={styles.addItemsButton}
              onPress={() => setItemPickerVisible(true)}
            >
              <Icon name="add-circle-outline" size={24} color="#121416" />
              <Text style={styles.addItemsButtonText}>
                Add Items from Wardrobe
              </Text>
            </TouchableOpacity>
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

        <WardrobeItemPicker
          visible={itemPickerVisible}
          onClose={() => setItemPickerVisible(false)}
          onSelect={handleItemsSelected}
          selectedItems={selectedItems}
          title="Select Wardrobe Items"
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
  emptyText: {
    fontSize: 16,
    color: "#6a7681",
    textAlign: "center",
    marginVertical: 24,
  },
  addItemsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  addItemsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginLeft: 8,
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
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "400",
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
});

export default CreateOutfit;
