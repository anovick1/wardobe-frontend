import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { searchWardrobeItems, debounce } from "../../utils/searchUtils";
import FilterButtons from "./FilterButtons";
import useCachedImage from "../../hooks/useCachedImage";
import { useWardrobe } from "../../contexts/WardrobeContext";

const WardrobeItemPicker = ({
  visible,
  onClose,
  onSelect,
  selectedItems = [],
  title = "Select Items",
}) => {
  const { getAllWardrobeItemsForSelection } = useWardrobe();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [localSelectedItems, setLocalSelectedItems] = useState(selectedItems);

  // Debounce search query
  const debouncedSearch = useMemo(
    () => debounce((query) => setDebouncedSearchQuery(query), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Sync selected items when prop changes
  useEffect(() => {
    setLocalSelectedItems(selectedItems);
  }, [selectedItems]);

  // Load wardrobe items when modal opens
  useEffect(() => {
    if (visible) {
      loadItems();
    }
  }, [visible]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const allItems = await getAllWardrobeItemsForSelection();
      setItems(allItems || []);
    } catch (error) {
      console.error("Error loading wardrobe items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filterItems = (items) => {
    if (Object.keys(filters).length === 0) {
      return items;
    }

    return items.filter((item) => {
      // Check brand filter
      if (filters.brand && filters.brand.length > 0) {
        if (!item.brand || !filters.brand.includes(item.brand)) {
          return false;
        }
      }

      // Check category filter
      if (filters.category && filters.category.length > 0) {
        let itemCategory = "";
        if (item.category && item.subcategory) {
          itemCategory = `${item.category} - ${item.subcategory}`;
        } else if (item.category) {
          itemCategory = item.category;
        } else if (item.subcategory) {
          itemCategory = item.subcategory;
        }

        if (!itemCategory || !filters.category.includes(itemCategory)) {
          return false;
        }
      }

      // Check color filter
      if (filters.color && filters.color.length > 0) {
        if (!item.primary_color || !filters.color.includes(item.primary_color)) {
          return false;
        }
      }

      // Check tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!item.tags || !Array.isArray(item.tags)) {
          return false;
        }

        const hasMatchingTag = filters.tags.some((selectedTag) =>
          item.tags.includes(selectedTag)
        );

        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  };

  // Apply search and filters
  const searchedItems = searchWardrobeItems(items, debouncedSearchQuery);
  const filteredItems = filterItems(searchedItems);

  const toggleItemSelection = (itemId) => {
    setLocalSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleApply = () => {
    onSelect(localSelectedItems);
    onClose();
  };

  const ItemImage = ({ item }) => {
    const { uri, loading, error } = useCachedImage(item.image_url, item.id);

    if (loading) {
      return (
        <View style={[styles.itemImage, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="small" color="#6a7681" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.itemImage, { alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name="error" size={24} color="#dc2626" />
        </View>
      );
    }

    return (
      <Image
        source={{ uri }}
        style={styles.itemImage}
        resizeMode="contain"
      />
    );
  };

  const renderItem = ({ item }) => {
    const isSelected = localSelectedItems.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.selectedItem]}
        onPress={() => toggleItemSelection(item.id)}
      >
        <ItemImage item={item} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name || item.title}
          </Text>
          <Text style={styles.itemBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Icon name="check" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#121416" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>
                Apply ({localSelectedItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Icon
                name="search"
                size={22}
                color="#6a7681"
                style={{ marginLeft: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor="#6a7681"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                >
                  <Icon name="clear" size={20} color="#6a7681" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filterSection}>
            <FilterButtons
              onFilterChange={setFilters}
              activeFilters={filters}
              wardrobeItems={items}
            />
          </View>

          {/* Items List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#121416" />
              <Text style={styles.loadingText}>Loading items...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No items found</Text>
                </View>
              }
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#121416",
    borderRadius: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    height: 44,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#121416",
    backgroundColor: "transparent",
    borderWidth: 0,
    marginLeft: 8,
    fontFamily: "System",
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6a7681",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  itemCard: {
    width: "31%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedItem: {
    borderColor: "#121416",
    backgroundColor: "#f1f5f9",
  },
  itemImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#fff",
  },
  itemInfo: {
    padding: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 11,
    color: "#6a7681",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#121416",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6a7681",
  },
});

export default WardrobeItemPicker;