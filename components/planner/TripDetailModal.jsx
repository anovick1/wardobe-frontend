import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { tripsAPI, packingListsAPI } from "../../api";
import api from "../../api";
import { useNavigation } from "@react-navigation/native";
import { useOutfits } from "../../contexts/OutfitContext";
import EditTripModal from "./EditTripModal";
import SelectOutfitModal from "./SelectOutfitModal";
import PackingListDetailModal from "./PackingListDetailModal";

export default function TripDetailModal({
  visible,
  onClose,
  trip,
  onTripUpdated,
}) {
  const [tripDetails, setTripDetails] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [packingList, setPackingList] = useState(null);
  const [linkedOutfits, setLinkedOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSelectOutfitModal, setShowSelectOutfitModal] = useState(false);
  const [showPackingListModal, setShowPackingListModal] = useState(false);
  const [creatingAIOutfit, setCreatingAIOutfit] = useState(false);
  const navigation = useNavigation();
  const { addOutfit } = useOutfits();

  useEffect(() => {
    if (visible && trip) {
      setCurrentTrip(trip);
      fetchTripDetails();
    }
  }, [visible, trip]);

  const fetchTripDetails = async () => {
    if (!trip?.id) return;

    setLoading(true);
    try {
      const response = await tripsAPI.getTrip(trip.id);
      setTripDetails(response);
      setCurrentTrip(response);

      // Fetch the packing list for this trip
      const packingResponse = await packingListsAPI.getPackingLists({
        trip_id: trip.id
      });
      const packingLists = packingResponse.packing_lists || [];
      setPackingList(packingLists.length > 0 ? packingLists[0] : null);

      // Initialize empty linked outfits array
      setLinkedOutfits([]);

      // Fetch outfit details for each linked outfit - load incrementally
      const tripOutfits = response.trip_outfits || [];
      
      // Process outfits one by one to show them as they load
      tripOutfits.forEach(async (tripOutfit) => {
        try {
          const outfitResponse = await api.get(
            `/outfits/${tripOutfit.outfit_id}`
          );
          const outfit = {
            ...outfitResponse.data,
            trip_day: tripOutfit.trip_day,
            status: tripOutfit.status,
          };
          
          // Add this outfit to the list immediately
          setLinkedOutfits(prevOutfits => [...prevOutfits, outfit]);
        } catch (error) {
          console.error("Error fetching outfit:", error);
        }
      });
    } catch (error) {
      console.error("Error fetching trip details:", error);
      Alert.alert("Error", "Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip? This will also delete all associated packing lists.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await tripsAPI.deleteTrip(trip.id);
              Alert.alert("Success", "Trip deleted successfully");
              if (onTripUpdated) {
                onTripUpdated();
              }
              onClose();
            } catch (error) {
              console.error("Error deleting trip:", error);
              Alert.alert("Error", "Failed to delete trip");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUnlinkOutfit = async (outfitId) => {
    Alert.alert("Unlink Outfit", "Remove this outfit from the trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink",
        style: "destructive",
        onPress: async () => {
          try {
            await tripsAPI.unlinkOutfitFromTrip(trip.id, outfitId);
            Alert.alert("Success", "Outfit unlinked from trip");
            fetchTripDetails();
          } catch (error) {
            console.error("Error unlinking outfit:", error);
            Alert.alert("Error", "Failed to unlink outfit");
          }
        },
      },
    ]);
  };

  const handleCreateAIOutfit = async () => {
    setCreatingAIOutfit(true);
    try {
      // Get user's wardrobe
      const wardrobeResponse = await api.get("/wardrobe_items");
      
      // Handle different response structures
      let wardrobeData = [];
      if (wardrobeResponse.data?.wardrobe_items && Array.isArray(wardrobeResponse.data.wardrobe_items)) {
        wardrobeData = wardrobeResponse.data.wardrobe_items;
      } else if (Array.isArray(wardrobeResponse.data)) {
        wardrobeData = wardrobeResponse.data;
      } else if (wardrobeResponse.data && typeof wardrobeResponse.data === 'object') {
        // If data is an object, try to extract items from common properties
        wardrobeData = wardrobeResponse.data.items || wardrobeResponse.data.results || [];
      }
      
      if (!Array.isArray(wardrobeData) || wardrobeData.length === 0) {
        Alert.alert(
          "Error",
          "You need items in your wardrobe to generate an outfit."
        );
        return;
      }

      const wardrobe = wardrobeData.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category_name || item.category,
        color: item.primary_color,
        tags: item.tags,
        image_url: item.image_url,
      }));

      // Create AI prompt based on trip
      const tripContext = `${currentTrip?.title || trip.title}${
        currentTrip?.location ? ` in ${currentTrip.location}` : ""
      }`;
      const aiPrompt = `Create an outfit for trip: ${tripContext}`;

      const payload = {
        prompt: aiPrompt,
      };

      // Add trip info for context
      payload.selected_trip = {
        name: currentTrip?.title || trip.title,
        start_date: currentTrip?.start_date || trip.start_date,
        end_date: currentTrip?.end_date || trip.end_date,
        location: currentTrip?.location || trip.location,
      };

      const response = await api.post("/outfits/ai_generate_hybrid", payload);
      const { outfit } = response.data;

      // Add the new outfit to context
      addOutfit(outfit);

      // Link the outfit to the trip
      await tripsAPI.linkOutfitToTrip(trip.id, outfit.id);

      Alert.alert("Success", "AI outfit created and linked to trip!");
      fetchTripDetails(); // Refresh the trip details

      // Navigate to outfit detail
      onClose();
      navigation.navigate("Wardrobe", {
        screen: "OutfitDetail",
        params: { outfitId: outfit.id },
      });
    } catch (error) {
      console.error("Error creating AI outfit:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create AI outfit. Please try again."
      );
    } finally {
      setCreatingAIOutfit(false);
    }
  };

  const handlePackingListPress = () => {
    if (packingList) {
      setShowPackingListModal(true);
    }
  };

  const formatTripDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    return `${startStr} - ${endStr}`;
  };

  if (!trip) return null;

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
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              style={styles.editButton}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Icon name="edit" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteTrip}
              style={styles.deleteButton}
              disabled={deleting}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Icon name="delete" size={20} color="#ef4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading trip details...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Trip Info */}
            <View style={styles.tripInfoCard}>
              <View style={styles.tripHeader}>
                <Icon name="flight" size={24} color="#3b82f6" />
                <Text style={styles.tripTitle}>
                  {currentTrip?.title || trip.title}
                </Text>
              </View>
              
              <View style={styles.tripDetailRow}>
                <Icon name="place" size={18} color="#6b7280" />
                <Text style={styles.tripDetailText}>
                  {currentTrip?.location || trip.location}
                </Text>
              </View>
              
              <View style={styles.tripDetailRow}>
                <Icon name="calendar-today" size={18} color="#6b7280" />
                <Text style={styles.tripDetailText}>
                  {formatDateRange(
                    currentTrip?.start_date || trip.start_date,
                    currentTrip?.end_date || trip.end_date
                  )}
                </Text>
              </View>
              
              <View style={styles.tripDetailRow}>
                <Icon name="schedule" size={18} color="#6b7280" />
                <Text style={styles.tripDetailText}>
                  {formatTripDuration(
                    currentTrip?.start_date || trip.start_date,
                    currentTrip?.end_date || trip.end_date
                  )}
                </Text>
              </View>

              {(currentTrip?.notes || trip.notes) && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>
                    {currentTrip?.notes || trip.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* Packing List Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Packing List</Text>
                {packingList && (
                  <Text style={styles.packingListCount}>
                    {packingList.items_count || 0} items • {packingList.packed_items_count || 0} packed
                  </Text>
                )}
              </View>

              {packingList ? (
                <TouchableOpacity
                  style={styles.packingListCard}
                  onPress={handlePackingListPress}
                >
                  <View style={styles.packingListHeader}>
                    <Icon name="luggage" size={24} color="#3b82f6" />
                    <Text style={styles.packingListTitle}>
                      {packingList.title}
                    </Text>
                    <Icon name="chevron-right" size={20} color="#6b7280" />
                  </View>
                  
                  <View style={styles.packingListMeta}>
                    <Text style={styles.packingListDescription}>
                      Tap to view and manage your packing list
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="luggage" size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No Packing List</Text>
                  <Text style={styles.emptyText}>
                    Your packing list will be automatically created when you create a trip
                  </Text>
                </View>
              )}
            </View>

            {/* Linked Outfits Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Linked Outfits</Text>
                <Text style={styles.outfitCount}>
                  {linkedOutfits.length} outfit{linkedOutfits.length !== 1 ? "s" : ""}
                </Text>
              </View>

              {linkedOutfits.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="checkroom" size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No Outfits Linked</Text>
                  <Text style={styles.emptyText}>
                    Link outfits from your wardrobe to plan for this trip
                  </Text>
                </View>
              ) : (
                <View style={styles.outfitsGrid}>
                  {linkedOutfits.map((outfit) => (
                    <TouchableOpacity
                      key={outfit.id}
                      style={styles.outfitCard}
                      onPress={() => {
                        onClose();
                        navigation.navigate("Wardrobe", {
                          screen: "OutfitDetail",
                          params: { outfitId: outfit.id },
                        });
                      }}
                    >
                      {outfit.composite_image_url ? (
                        <Image
                          source={{ uri: outfit.composite_image_url }}
                          style={styles.outfitImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={[styles.outfitImage, styles.placeholderImage]}
                        >
                          <Icon name="checkroom" size={32} color="#9ca3af" />
                        </View>
                      )}
                      <Text style={styles.outfitTitle} numberOfLines={1}>
                        {outfit.title || "Untitled Outfit"}
                      </Text>
                      <View style={styles.outfitMeta}>
                        <Text style={styles.outfitItemCount}>
                          {outfit.wardrobe_items?.length || 0} items
                        </Text>
                        {outfit.trip_day && (
                          <Text style={styles.tripDay}>
                            {new Date(outfit.trip_day).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric"
                            })}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.unlinkButton}
                        onPress={() => handleUnlinkOutfit(outfit.id)}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <Icon name="close" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Outfit Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outfit Management</Text>

              <View style={styles.actionButtonsGrid}>
                {/* AI Generate Button */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.aiButton]}
                  onPress={handleCreateAIOutfit}
                  disabled={creatingAIOutfit}
                >
                  {creatingAIOutfit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="auto-awesome" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>AI Generate</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Create New Button */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.createButton]}
                  onPress={() => {
                    onClose();
                    navigation.navigate("Wardrobe", {
                      screen: "CreateOutfit",
                      params: { 
                        tripId: trip.id,
                        tripTitle: currentTrip?.title || trip.title,
                        tripLocation: currentTrip?.location || trip.location 
                      },
                    });
                  }}
                >
                  <Icon name="add" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Create New</Text>
                </TouchableOpacity>

                {/* Link Existing Button */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.linkButton]}
                  onPress={() => setShowSelectOutfitModal(true)}
                >
                  <Icon name="link" size={20} color="#3b82f6" />
                  <Text style={[styles.actionButtonText, { color: "#3b82f6" }]}>
                    Link Existing
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Edit Trip Modal */}
      <EditTripModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        trip={currentTrip}
        onTripUpdated={(updatedTrip) => {
          setCurrentTrip(updatedTrip);
          if (onTripUpdated) {
            onTripUpdated();
          }
        }}
      />

      {/* Select Outfit Modal */}
      <SelectOutfitModal
        visible={showSelectOutfitModal}
        onClose={() => setShowSelectOutfitModal(false)}
        trip={currentTrip || trip}
        onOutfitSelected={() => {
          // SelectOutfitModal handles the linking internally
          // We just need to refresh the trip details
          fetchTripDetails();
        }}
      />

      {/* Packing List Detail Modal */}
      <PackingListDetailModal
        visible={showPackingListModal}
        onClose={() => {
          setShowPackingListModal(false);
          // Refresh packing list data when modal closes
          fetchTripDetails();
        }}
        packingList={packingList}
      />
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editButton: {
    padding: 8,
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
  tripInfoCard: {
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
  tripHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  tripTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#121416",
    flex: 1,
  },
  tripDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  tripDetailText: {
    fontSize: 16,
    color: "#6b7280",
    flex: 1,
  },
  notesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
  },
  packingListCount: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  packingListCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  packingListHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  packingListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    flex: 1,
  },
  packingListMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packingListItems: {
    fontSize: 14,
    color: "#6b7280",
  },
  packingListPacked: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "500",
  },
  packingListDescription: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8b5cf6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  outfitCount: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outfitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  outfitCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  outfitImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholderImage: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  outfitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 4,
  },
  outfitMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  outfitItemCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  tripDay: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
  },
  unlinkButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 4,
  },
  actionButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 8,
    flex: 1,
    minWidth: "30%",
    shadowColor: "#1f2937",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  aiButton: {
    backgroundColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.15,
  },
  createButton: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOpacity: 0.15,
  },
  linkButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#3b82f6",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});