import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { eventsAPI, tripsAPI } from "../../api";
import { dataManager } from "../../services/DataManager";
import { useOutfits } from "../../contexts/OutfitContext";

export default function SelectOutfitModal({
  visible,
  onClose,
  event,
  trip,
  onOutfitSelected,
}) {
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedOutfits, setSelectedOutfits] = useState(new Set());
  const [linking, setLinking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Use the existing OutfitContext for efficient data loading
  const { allOutfits, loadingOutfits, fetchAllOutfits } = useOutfits();

  useEffect(() => {
    if (visible) {
      fetchAllOutfits(true);
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setSelectedOutfits(new Set());
      setCurrentPage(1);
      setHasMoreData(true);
    }
  }, [visible, fetchAllOutfits]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredOutfitsData = useMemo(() => {
    if (debouncedSearchQuery.trim()) {
      return allOutfits.filter((outfit) =>
        (outfit.title || "Untitled")
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()),
      );
    }
    return allOutfits;
  }, [debouncedSearchQuery, allOutfits]);

  useEffect(() => {
    setFilteredOutfits(filteredOutfitsData);
    setCurrentPage(1);
    setHasMoreData(true);
  }, [filteredOutfitsData]);

  const handleSelectOutfit = useCallback((outfitId) => {
    setSelectedOutfits((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(outfitId)) {
        newSelected.delete(outfitId);
      } else {
        newSelected.add(outfitId);
      }
      return newSelected;
    });
  }, []);

  const handleLinkSelectedOutfits = async () => {
    if (selectedOutfits.size === 0) {
      Alert.alert("Error", "Please select at least one outfit");
      return;
    }

    setLinking(true);
    try {
      const promises = Array.from(selectedOutfits).map(async (outfitId) => {
        if (event) {
          return eventsAPI.linkOutfitToEvent(event.id, outfitId);
        } else if (trip) {
          return tripsAPI.linkOutfitToTrip(trip.id, outfitId);
        } else {
          throw new Error("No event or trip provided");
        }
      });

      await Promise.all(promises);

      const count = selectedOutfits.size;
      const targetType = event ? "event" : "trip";
      Alert.alert(
        "Success",
        `${count} outfit${count > 1 ? "s" : ""} linked to ${targetType} successfully!`,
      );

      if (onOutfitSelected) {
        onOutfitSelected();
      }
      onClose();
    } catch (error) {
      const targetType = event ? "event" : "trip";
      console.error(`Error linking outfits to ${targetType}:`, error);
      Alert.alert(
        "Error",
        error.response?.data?.error || `Failed to link outfits to ${targetType}`,
      );
    } finally {
      setLinking(false);
    }
  };

  const renderOutfitItem = useCallback(
    ({ item: outfit, index }) => {
      const isSelected = selectedOutfits.has(outfit.id);
      return (
        <TouchableOpacity
          style={[
            styles.outfitCard,
            isSelected && styles.outfitCardSelected,
            index % 2 === 0 ? styles.outfitCardLeft : styles.outfitCardRight,
          ]}
          onPress={() => handleSelectOutfit(outfit.id)}
          activeOpacity={0.7}
        >
          {outfit.composite_image_url ? (
            <Image
              source={{ uri: outfit.composite_image_url }}
              style={styles.outfitImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.outfitImage, styles.placeholderImage]}>
              <Icon name="checkroom" size={32} color="#9ca3af" />
            </View>
          )}
          <Text style={styles.outfitTitle} numberOfLines={1}>
            {outfit.title || "Untitled Outfit"}
          </Text>
          <Text style={styles.outfitItemCount}>
            {outfit.wardrobe_items?.length || outfit.item_count || 0} items
          </Text>

          {/* Selection Indicator */}
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <Icon name="check-circle" size={24} color="#3b82f6" />
            ) : (
              <Icon name="radio-button-unchecked" size={24} color="#d1d5db" />
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedOutfits, handleSelectOutfit],
  );

  const handleLoadMore = useCallback(() => {
    if (
      !loadingMore &&
      hasMoreData &&
      filteredOutfits.length >= 10 * currentPage
    ) {
      setLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
      setTimeout(() => {
        setLoadingMore(false);
        if (filteredOutfits.length < 10 * (currentPage + 1)) {
          setHasMoreData(false);
        }
      }, 100);
    }
  }, [loadingMore, hasMoreData, filteredOutfits.length, currentPage]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }, [loadingMore]);


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
          <Text style={styles.headerTitle}>Select Outfits</Text>
          <TouchableOpacity
            onPress={handleLinkSelectedOutfits}
            style={[
              styles.linkButton,
              (selectedOutfits.size === 0 || linking) &&
                styles.linkButtonDisabled,
            ]}
            disabled={selectedOutfits.size === 0 || linking}
          >
            {linking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.linkButtonText}>
                Link ({selectedOutfits.size})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search outfits..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Icon name="clear" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Event Info Banner */}
        <View style={styles.eventBanner}>
          <Text style={styles.eventBannerText}>
            Adding outfits to:{" "}
            <Text style={styles.eventTitle}>{event?.title}</Text>
          </Text>
        </View>

        {/* Outfits List */}
        {loadingOutfits ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading outfits...</Text>
          </View>
        ) : filteredOutfits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="checkroom" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No Matching Outfits" : "No Outfits Found"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Try a different search term"
                : "Create some outfits first to link them to events"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOutfits}
            renderItem={renderOutfitItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={8}
            removeClippedSubviews={true}
          />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121416",
  },
  linkButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  linkButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  linkButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#121416",
    marginLeft: 12,
  },
  eventBanner: {
    backgroundColor: "#eff6ff",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  eventBannerText: {
    fontSize: 14,
    color: "#1e40af",
    textAlign: "center",
  },
  eventTitle: {
    fontWeight: "600",
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
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
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  flatListContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  outfitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  outfitCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    margin: "1%",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    position: "relative",
  },
  outfitCardLeft: {
    marginRight: 5,
  },
  outfitCardRight: {
    marginLeft: 5,
  },
  footerLoader: {
    padding: 20,
    alignItems: "center",
  },
  outfitCardSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  outfitImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  outfitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 4,
  },
  outfitItemCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
