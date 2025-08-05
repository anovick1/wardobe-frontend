import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { packingListsAPI } from "../../api";

export default function PackingListDetailModal({
  visible,
  onClose,
  packingList,
}) {
  const [packingListDetails, setPackingListDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    if (visible && packingList) {
      fetchPackingListDetails();
    }
  }, [visible, packingList]);

  const fetchPackingListDetails = async () => {
    if (!packingList?.id) return;

    setLoading(true);
    try {
      const response = await packingListsAPI.getPackingList(packingList.id);
      setPackingListDetails(response);
    } catch (error) {
      console.error("Error fetching packing list details:", error);
      Alert.alert("Error", "Failed to load packing list details");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemPacked = async (itemId, currentStatus) => {
    setUpdatingItem(itemId);
    try {
      await packingListsAPI.updatePackingListItem(packingList.id, itemId, {
        is_packed: !currentStatus,
      });
      // Refresh the packing list details
      await fetchPackingListDetails();
    } catch (error) {
      console.error("Error updating packing list item:", error);
      Alert.alert("Error", "Failed to update item status");
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    setAddingItem(true);
    try {
      // Create new packing list item
      const itemData = {
        name: newItemName.trim(),
        category: newItemCategory.trim() || "General",
        quantity: 1,
        is_packed: false
      };

      await packingListsAPI.addPackingListItem(packingList.id, itemData);
      
      // Clear form
      setNewItemName("");
      setNewItemCategory("");
      setShowAddForm(false);
      
      // Refresh the packing list
      await fetchPackingListDetails();
      
      Alert.alert("Success", "Item added to packing list!");
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item to packing list");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to remove "${itemName}" from your packing list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingItem(itemId);
            try {
              await packingListsAPI.deletePackingListItem(packingList.id, itemId);
              
              // Refresh the packing list details
              await fetchPackingListDetails();
              
              Alert.alert("Success", "Item removed from packing list");
            } catch (error) {
              console.error("Error deleting packing list item:", error);
              Alert.alert("Error", "Failed to delete item");
            } finally {
              setDeletingItem(null);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPackedCount = () => {
    if (!packingListDetails?.items) return 0;
    return packingListDetails.items.filter((item) => item.is_packed).length;
  };

  const getTotalCount = () => {
    return packingListDetails?.items?.length || 0;
  };

  const getProgressPercentage = () => {
    const total = getTotalCount();
    if (total === 0) return 0;
    return Math.round((getPackedCount() / total) * 100);
  };

  const getCategoryItems = (category) => {
    if (!packingListDetails?.items) return [];
    return packingListDetails.items.filter((item) => item.category === category);
  };

  const getCategories = () => {
    if (!packingListDetails?.items) return [];
    const categories = [...new Set(packingListDetails.items.map((item) => item.category))];
    return categories.sort();
  };

  if (!packingList) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={24} color="#121416" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Packing List</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name={showAddForm ? "close" : "add"} size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading packing list...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Packing List Header */}
            <View style={styles.packingListHeader}>
              <View style={styles.titleContainer}>
                <View style={styles.titleRow}>
                  <Icon
                    name="luggage"
                    size={24}
                    color="#3b82f6"
                  />
                  <Text style={styles.packingListTitle}>
                    {packingListDetails?.title || packingList.title}
                  </Text>
                </View>
              </View>

              {packingListDetails?.created_at && (
                <Text style={styles.createdDate}>
                  Created {formatDate(packingListDetails.created_at)}
                </Text>
              )}

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressText}>
                    {getPackedCount()}/{getTotalCount()} items ({getProgressPercentage()}%)
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${getProgressPercentage()}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Add Item Form */}
            {showAddForm && (
              <View style={styles.addItemForm}>
                <Text style={styles.formTitle}>Add New Item</Text>
                
                <View style={styles.formRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Item name (e.g., Sunglasses)"
                    value={newItemName}
                    onChangeText={setNewItemName}
                    maxLength={100}
                  />
                </View>

                <View style={styles.formRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Category (e.g., Accessories)"
                    value={newItemCategory}
                    onChangeText={setNewItemCategory}
                    maxLength={50}
                  />
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddForm(false);
                      setNewItemName("");
                      setNewItemCategory("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.formButton, styles.addItemButton]}
                    onPress={handleAddItem}
                    disabled={addingItem || !newItemName.trim()}
                  >
                    {addingItem ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.addItemButtonText}>Add Item</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Items by Category */}
            {getCategories().map((category) => {
              const categoryItems = getCategoryItems(category);
              const packedItems = categoryItems.filter((item) => item.is_packed).length;

              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.categoryCount}>
                      {packedItems}/{categoryItems.length}
                    </Text>
                  </View>

                  <View style={styles.itemsList}>
                    {categoryItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.itemCard,
                          item.is_packed && styles.itemCardPacked,
                        ]}
                        onPress={() => toggleItemPacked(item.id, item.is_packed)}
                        disabled={updatingItem === item.id}
                      >
                        <View style={styles.itemContent}>
                          <View style={styles.itemInfo}>
                            <Text
                              style={[
                                styles.itemName,
                                item.is_packed && styles.itemNamePacked,
                              ]}
                            >
                              {item.name}
                            </Text>
                            {item.quantity > 1 && (
                              <Text style={styles.itemQuantity}>
                                Qty: {item.quantity}
                              </Text>
                            )}
                            {item.notes && (
                              <Text style={styles.itemNotes}>{item.notes}</Text>
                            )}
                          </View>

                          <View style={styles.itemActions}>
                            {updatingItem === item.id ? (
                              <ActivityIndicator size="small" color="#3b82f6" />
                            ) : (
                              <View
                                style={[
                                  styles.checkbox,
                                  item.is_packed && styles.checkboxChecked,
                                ]}
                              >
                                {item.is_packed && (
                                  <Icon name="check" size={16} color="#fff" />
                                )}
                              </View>
                            )}
                            
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteItem(item.id, item.name)}
                              disabled={deletingItem === item.id}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              {deletingItem === item.id ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                              ) : (
                                <Icon name="delete" size={18} color="#ef4444" />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}

            {getTotalCount() === 0 && (
              <View style={styles.emptyState}>
                <Icon name="luggage" size={48} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No Items</Text>
                <Text style={styles.emptyText}>
                  This packing list doesn't have any items yet.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  addButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  packingListHeader: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  titleContainer: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  packingListTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#121416",
    flex: 1,
  },
  createdDate: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
  },
  progressText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
  },
  categoryCount: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  itemCardPacked: {
    backgroundColor: "#f0fdf4",
    borderColor: "#10b981",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#121416",
    marginBottom: 4,
  },
  itemNamePacked: {
    textDecorationLine: "line-through",
    color: "#6b7280",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 12,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxChecked: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
  },
  addItemForm: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#121416",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  addItemButton: {
    backgroundColor: "#10b981",
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});