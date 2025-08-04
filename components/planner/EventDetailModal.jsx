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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { eventsAPI } from "../../api";
import api from "../../api";
import { useNavigation } from "@react-navigation/native";
import { useWeather } from "../../contexts/WeatherContext";
import { useOutfits } from "../../contexts/OutfitContext";
import EditEventModal from "./EditEventModal";
import SelectOutfitModal from "./SelectOutfitModal";

export default function EventDetailModal({
  visible,
  onClose,
  event,
  onEventUpdated,
}) {
  const [eventDetails, setEventDetails] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [linkedOutfits, setLinkedOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSelectOutfitModal, setShowSelectOutfitModal] = useState(false);
  const [creatingAIOutfit, setCreatingAIOutfit] = useState(false);
  const [creatingManualOutfit, setCreatingManualOutfit] = useState(false);
  const navigation = useNavigation();
  const { weather, coordinates } = useWeather();
  const { addOutfit } = useOutfits();

  useEffect(() => {
    if (visible && event) {
      setCurrentEvent(event);
      fetchEventDetails();
    }
  }, [visible, event]);

  const fetchEventDetails = async () => {
    if (!event?.id) return;

    setLoading(true);
    try {
      const response = await eventsAPI.getEvent(event.id);
      setEventDetails(response);
      setCurrentEvent(response); // Update current event with fresh data

      // Fetch outfit details for each scheduled outfit
      const outfitPromises = (response.scheduled_outfits || []).map(
        async (scheduled) => {
          try {
            const outfitResponse = await api.get(
              `/outfits/${scheduled.outfit_id}`
            );
            return {
              ...outfitResponse.data,
              scheduled_status: scheduled.status,
            };
          } catch (error) {
            console.error("Error fetching outfit:", error);
            return null;
          }
        }
      );

      const outfits = await Promise.all(outfitPromises);
      setLinkedOutfits(outfits.filter(Boolean));
    } catch (error) {
      console.error("Error fetching event details:", error);
      Alert.alert("Error", "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This will unlink all associated outfits.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await eventsAPI.deleteEvent(event.id);
              Alert.alert("Success", "Event deleted successfully");
              if (onEventUpdated) {
                onEventUpdated();
              }
              onClose();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete event");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUnlinkOutfit = async (outfitId) => {
    Alert.alert("Unlink Outfit", "Remove this outfit from the event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink",
        style: "destructive",
        onPress: async () => {
          try {
            await eventsAPI.unlinkOutfitFromEvent(event.id, outfitId);
            Alert.alert("Success", "Outfit unlinked from event");
            fetchEventDetails();
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
      const wardrobe = wardrobeResponse.data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.primary_color,
        tags: item.tags,
        image_url: item.image_url,
      }));

      if (wardrobe.length === 0) {
        Alert.alert(
          "Error",
          "You need items in your wardrobe to generate an outfit."
        );
        return;
      }

      // Create AI prompt based on event
      const eventContext = `${currentEvent?.title || event.title}${
        currentEvent?.location ? ` at ${currentEvent.location}` : ""
      }`;
      const aiPrompt = `Create an outfit for: ${eventContext}`;

      const payload = {
        prompt: aiPrompt,
      };

      // Add location data if available
      if (coordinates?.lat && coordinates?.lon) {
        payload.lat = coordinates.lat;
        payload.lon = coordinates.lon;
      }

      // Add event info for context
      payload.selected_event = {
        name: currentEvent?.title || event.title,
        date: currentEvent?.datetime || event.datetime,
        location: currentEvent?.location || event.location,
      };

      const response = await api.post("/outfits/ai_generate_hybrid", payload);
      const { outfit } = response.data;

      // Add the new outfit to context
      addOutfit(outfit);

      // Link the outfit to the event
      await eventsAPI.linkOutfitToEvent(event.id, outfit.id);

      Alert.alert("Success", "AI outfit created and linked to event!");
      fetchEventDetails(); // Refresh the event details

      // Navigate to outfit detail
      onClose();
      navigation.navigate("Wardrobe", {
        screen: "OutfitDetail",
        params: { outfitId: outfit.id },
      });
    } catch (error) {
      console.error("Failed to create AI outfit:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          "Failed to create outfit. Please try again."
      );
    } finally {
      setCreatingAIOutfit(false);
    }
  };

  const handleCreateManualOutfit = () => {
    // Navigate to manual outfit creation with event context
    onClose();
    navigation.navigate("Wardrobe", {
      screen: "CreateOutfit",
      params: {
        eventId: event.id,
        eventTitle: currentEvent?.title || event.title,
      },
    });
  };

  const formatEventDateTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!event) return null;

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
          <Text style={styles.headerTitle}>Event Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              style={styles.editButton}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Icon name="edit" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteEvent}
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
            <Text style={styles.loadingText}>Loading event details...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Event Info */}
            <View style={styles.eventInfoCard}>
              <Text style={styles.eventTitle}>
                {currentEvent?.title || event.title}
              </Text>
              <View style={styles.eventDetailRow}>
                <Icon name="schedule" size={18} color="#6b7280" />
                <Text style={styles.eventDetailText}>
                  {formatEventDateTime(
                    currentEvent?.datetime || event.datetime
                  )}
                </Text>
              </View>
              {(currentEvent?.location || event.location) && (
                <View style={styles.eventDetailRow}>
                  <Icon name="place" size={18} color="#6b7280" />
                  <Text style={styles.eventDetailText}>
                    {currentEvent?.location || event.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Linked Outfits */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Linked Outfits</Text>
                <Text style={styles.outfitCount}>
                  {linkedOutfits.length} outfit
                  {linkedOutfits.length !== 1 ? "s" : ""}
                </Text>
              </View>

              {linkedOutfits.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="checkroom" size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No Outfits Linked</Text>
                  <Text style={styles.emptyText}>
                    Link outfits from your wardrobe to plan for this event
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
                        // Navigate to the nested OutfitDetail screen
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
                        {outfit.scheduled_status === "worn" && (
                          <View style={styles.wornBadge}>
                            <Text style={styles.wornBadgeText}>Worn</Text>
                          </View>
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
              <Text style={styles.sectionTitle}>Create Outfit for Event</Text>

              <View style={styles.actionButtons}>
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

                {/* Manual Create Button */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.manualButton]}
                  onPress={handleCreateManualOutfit}
                  disabled={creatingManualOutfit}
                >
                  <Icon name="palette" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Create Outfit</Text>
                </TouchableOpacity>
              </View>

              {/* Link Existing Button */}
              <TouchableOpacity
                style={styles.linkExistingButton}
                onPress={() => setShowSelectOutfitModal(true)}
              >
                <Icon name="link" size={18} color="#3b82f6" />
                <Text style={styles.linkExistingButtonText}>
                  Link Existing Outfit
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Edit Event Modal */}
        <EditEventModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          event={currentEvent || event}
          onEventUpdated={() => {
            setShowEditModal(false);
            fetchEventDetails();
            if (onEventUpdated) {
              onEventUpdated();
            }
          }}
        />

        {/* Select Outfit Modal */}
        <SelectOutfitModal
          visible={showSelectOutfitModal}
          onClose={() => setShowSelectOutfitModal(false)}
          event={eventDetails || event}
          onOutfitSelected={() => {
            fetchEventDetails();
            if (onEventUpdated) {
              onEventUpdated();
            }
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  eventInfoCard: {
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
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#121416",
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 15,
    color: "#6b7280",
    marginLeft: 10,
    flex: 1,
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
  outfitCount: {
    fontSize: 14,
    color: "#6b7280",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
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
  outfitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  outfitCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: "1%",
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
  outfitMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  outfitItemCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  wornBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  wornBadgeText: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "500",
  },
  unlinkButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  aiButton: {
    backgroundColor: "#007AFF",
  },
  manualButton: {
    backgroundColor: "#007AFF",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  linkExistingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  linkExistingButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
});
