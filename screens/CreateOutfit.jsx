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
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import api from "../api";

const CreateOutfit = () => {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedItem } = route.params || {};
  const { user } = useContext(AuthContext);

  const fetchWardrobeItems = async () => {
    try {
      const response = await api.get("/wardrobe_items");
      setWardrobeItems(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load wardrobe items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
    }
  }, [user]);

  useEffect(() => {
    if (selectedItem) {
      setSelectedItems([selectedItem.id]);
    }
  }, [selectedItem]);

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleCreateOutfit = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one item for your outfit");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/outfits/manual_create", {
        wardrobe_item_ids: selectedItems,
        notes: notes,
      });

      Alert.alert("Success", "Outfit created successfully");
      navigation.navigate("Wardrobe", { screen: "Outfits" });
    } catch (error) {
      Alert.alert("Error", "Failed to create outfit");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Outfit</Text>
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
        <View style={styles.notesContainer}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this outfit..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.itemsContainer}>
          <Text style={styles.label}>
            Selected Items ({selectedItems.length})
          </Text>
          <View style={styles.selectedItemsContainer}>
            {selectedItems.map((itemId) => {
              const item = wardrobeItems.find((i) => i.id === itemId);
              if (!item) return null;
              return (
                <View key={itemId} style={styles.selectedItemCard}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.selectedItemImage}
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

          <Text style={[styles.label, { marginTop: 16 }]}>Add More Items</Text>
          <View style={styles.itemsGrid}>
            {wardrobeItems
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
        </View>
      </ScrollView>
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
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  notesContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  itemsContainer: {
    padding: 16,
  },
  selectedItemsContainer: {
    marginBottom: 16,
  },
  selectedItemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
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
  selectedItemImage: {
    width: 80,
    height: 80,
  },
  selectedItemInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  selectedItemBrand: {
    fontSize: 14,
    color: "#666",
  },
  removeItemButton: {
    padding: 12,
    justifyContent: "center",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
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
    height: 150,
  },
  itemInfo: {
    padding: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemBrand: {
    fontSize: 12,
    color: "#666",
  },
});

export default CreateOutfit;
