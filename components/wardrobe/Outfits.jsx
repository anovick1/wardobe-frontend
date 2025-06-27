import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";

import * as Calendar from "expo-calendar";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import OutfitCard from "./OutfitCard";
import { useOutfits } from "../../contexts/OutfitContext";
import { useWeather } from "../../contexts/WeatherContext";
import api from "../../api";
import globalStyles from "../../styles/global";
import { mapEventsForApi } from "../../utils/events";

const Outfits = forwardRef(({ filters = [], searchQuery = "" }, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventDays, setEventDays] = useState(7); // Default to 7 days
  const [showEmptyEvents, setShowEmptyEvents] = useState(false);
  const navigation = useNavigation();

  const {
    outfits: rawOutfits,
    loadingOutfits,
    loadingMoreOutfits,
    currentPage,
    totalPages,
    addOutfit,
    loadMoreOutfits,
    updateOutfitWornStatus,
    hasMoreOutfits,
  } = useOutfits();

  const { coordinates } = useWeather();

  // Filter outfits based on search query and active filters
  const filterOutfits = (outfits) => {
    let filtered = outfits;

    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();

      filtered = filtered.filter((outfit) => {
        // Search in outfit properties only
        const searchableText = [
          outfit.name || "",
          outfit.description || "",
          outfit.generated_prompt || "",
          outfit.prompt || "",
          outfit.title || "",
          outfit.notes || "",
          // Include outfit tags if they exist
          (outfit.tags || []).join(" "),
          // Search through all string properties of the outfit
          ...Object.values(outfit).filter((value) => typeof value === "string"),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Apply filters
    if (Object.keys(filters).length === 0) {
      return filtered;
    }

    return filtered.filter((outfit) => {
      // Quick filters (worn)
      if (filters.quick && filters.quick.length > 0) {
        const matchesQuickFilter = filters.quick.some((filter) => {
          switch (filter) {
            case "worn":
              return outfit.is_worn === true;
            default:
              return false;
          }
        });

        if (!matchesQuickFilter) return false;
      }

      // Outfit Type filter
      if (filters.outfit_type && filters.outfit_type.length > 0) {
        const isDailyOutfit = outfit.is_daily_outfit === true;
        const isAIGenerated =
          outfit.generated_by === "chatgpt" && !isDailyOutfit;
        const isManual = outfit.generated_by === "manual";

        const matchesOutfitType = filters.outfit_type.some((creator) => {
          switch (creator) {
            case "Daily Outfit":
              return isDailyOutfit;
            case "AI Styled":
              return isAIGenerated;
            case "Created by Me":
              return isManual;
            default:
              return false;
          }
        });

        if (!matchesOutfitType) return false;
      }

      // Tags filter (outfit tags only)
      if (filters.tags && filters.tags.length > 0) {
        if (!outfit.tags || !Array.isArray(outfit.tags)) {
          return false;
        }

        const hasTags = outfit.tags.some((tag) => filters.tags.includes(tag));
        if (!hasTags) return false;
      }

      return true;
    });
  };

  // Apply search first, then filters (like WardrobeItems)
  const searchedOutfits = rawOutfits.filter((outfit) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const searchableText = [
      outfit.name || "",
      outfit.description || "",
      outfit.generated_prompt || "",
      outfit.prompt || "",
      outfit.title || "",
      outfit.notes || "",
      (outfit.tags || []).join(" "),
      ...Object.values(outfit).filter((value) => typeof value === "string"),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });

  const outfits = filterOutfits(searchedOutfits);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openAIGenerator: () => setModalVisible(true),
  }));

  // Fetch upcoming events when modal opens or event range changes
  useEffect(() => {
    if (modalVisible) {
      fetchUpcomingEvents();
    }
  }, [modalVisible, eventDays]);

  const fetchUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      setShowEmptyEvents(false); // Hide empty state during loading

      // Request both calendar and reminders permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const reminderStatus = await Calendar.requestRemindersPermissionsAsync();

      if (status !== "granted" || reminderStatus.status !== "granted") {
        // Only clear events if this is the first load (no existing events)
        if (upcomingEvents.length === 0) {
          setUpcomingEvents([]);
          setShowEmptyEvents(true);
        }
        return;
      }

      const calendars = await Calendar.getCalendarsAsync();
      if (!calendars || calendars.length === 0) {
        // Only clear events if this is the first load (no existing events)
        if (upcomingEvents.length === 0) {
          setUpcomingEvents([]);
          setShowEmptyEvents(true);
        }
        return;
      }

      // Get events from today to specified days from now
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + eventDays);
      endDate.setHours(23, 59, 59, 999);

      const allEvents = await Calendar.getEventsAsync(
        calendars.map((cal) => cal.id),
        startDate,
        endDate
      );

      // Filter and sort events
      const upcoming = allEvents
        .filter((event) => {
          const eventStart = new Date(event.startDate);
          return eventStart >= startDate;
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 10); // Limit to 10 events

      setUpcomingEvents(upcoming);
      setShowEmptyEvents(upcoming.length === 0); // Show empty state only if no events found
    } catch (error) {
      console.error("Error fetching events:", error);
      // Only clear events if this is the first load (no existing events)
      if (upcomingEvents.length === 0) {
        setUpcomingEvents([]);
        setShowEmptyEvents(true);
      }
    } finally {
      setLoadingEvents(false);
    }
  };

  const generateOutfitWithAI = async () => {
    if (!prompt.trim()) {
      Alert.alert("Error", "Please enter a prompt for the outfit");
      return;
    }

    setGenerating(true);
    try {
      // Prepare the request payload
      const payload = {
        prompt: prompt.trim(),
      };

      // Add location data if available
      if (coordinates?.lat && coordinates?.lon) {
        payload.lat = coordinates.lat;
        payload.lon = coordinates.lon;
      }

      // Add selected event if chosen
      if (selectedEvent) {
        payload.selected_event = mapEventsForApi([selectedEvent])[0];
      }

      const response = await api.post("/outfits/ai_generate_hybrid", payload);

      const { outfit } = response.data;

      // Add the new outfit to context
      addOutfit(outfit);

      // Close modal and reset form
      setModalVisible(false);
      setPrompt("");
      setSelectedEvent(null);

      // Navigate to outfit detail
      navigation.navigate("OutfitDetail", { outfit });
    } catch (error) {
      console.error("Failed to generate outfit:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          "Failed to generate outfit. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const renderItem = ({ item }) => <OutfitCard item={item} />;

  return (
    <SafeAreaView style={globalStyles.container} edges={["left", "right"]}>
      {/* Header moved to parent component */}

      {loadingOutfits && outfits.length <= 1 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading outfits...</Text>
        </View>
      ) : outfits.length === 0 ? (
        <Text style={[styles.emptyText]}>No outfits yet.</Text>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasMoreOutfits && !loadingMoreOutfits) {
              loadMoreOutfits();
            }
          }}
          ListFooterComponent={() =>
            loadingMoreOutfits ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
        />
      )}

      {/* AI Generate Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {generating && (
              <View style={styles.modalLoadingOverlay}>
                <View style={styles.modalLoadingContent}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.modalLoadingText}>
                    Generating outfit...
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Outfit with AI</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSelectedEvent(null);
                }}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.promptLabel}>
                Describe the outfit you want:
              </Text>
              <TextInput
                style={styles.promptInput}
                placeholder="e.g., Casual summer outfit for a coffee date"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {/* Weather Info */}
              {coordinates && (
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherLabel}>
                    🌤️ Weather data will be included automatically
                  </Text>
                  <Text style={styles.weatherDisclaimer}>
                    Forecasts available for the next 5 days
                  </Text>
                </View>
              )}
              {/* Event Selection */}
              <View style={styles.eventSectionHeader}>
                <Text style={styles.eventLabel}>Select Event (Optional):</Text>

                {/* Time Range Selector */}
                <View style={styles.timeRangeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      eventDays === 7 && styles.timeRangeButtonActive,
                    ]}
                    onPress={() => setEventDays(7)}
                  >
                    <Text
                      style={[
                        styles.timeRangeText,
                        eventDays === 7 && styles.timeRangeTextActive,
                      ]}
                    >
                      Week
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      eventDays === 14 && styles.timeRangeButtonActive,
                    ]}
                    onPress={() => setEventDays(14)}
                  >
                    <Text
                      style={[
                        styles.timeRangeText,
                        eventDays === 14 && styles.timeRangeTextActive,
                      ]}
                    >
                      2 Weeks
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      eventDays === 30 && styles.timeRangeButtonActive,
                    ]}
                    onPress={() => setEventDays(30)}
                  >
                    <Text
                      style={[
                        styles.timeRangeText,
                        eventDays === 30 && styles.timeRangeTextActive,
                      ]}
                    >
                      Month
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.eventOptionsContainer}>
                {loadingEvents && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.eventOptionsList,
                    loadingEvents && styles.eventOptionsLoading,
                  ]}
                >
                  {/* No Event Option */}
                  <TouchableOpacity
                    style={[
                      styles.eventOption,
                      !selectedEvent && styles.eventOptionSelected,
                    ]}
                    onPress={() => setSelectedEvent(null)}
                  >
                    <View style={styles.eventOptionContent}>
                      <Text style={styles.eventOptionIcon}>✨</Text>
                      <Text
                        style={[
                          styles.eventOptionTitle,
                          !selectedEvent && styles.eventOptionTitleSelected,
                        ]}
                      >
                        No specific event
                      </Text>
                    </View>
                    {!selectedEvent && (
                      <Icon name="check-circle" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>

                  {/* Event Options */}
                  {upcomingEvents.slice(0, 5).map((event) => {
                    const eventDate = new Date(event.startDate);
                    const isToday =
                      eventDate.toDateString() === new Date().toDateString();
                    const isTomorrow =
                      eventDate.toDateString() ===
                      new Date(Date.now() + 86400000).toDateString();

                    let dateLabel;
                    if (isToday) {
                      dateLabel = "Today";
                    } else if (isTomorrow) {
                      dateLabel = "Tomorrow";
                    } else {
                      dateLabel = eventDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });
                    }

                    const timeLabel = eventDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.eventOption,
                          selectedEvent?.id === event.id &&
                            styles.eventOptionSelected,
                        ]}
                        onPress={() => setSelectedEvent(event)}
                      >
                        <View style={styles.eventOptionContent}>
                          <Text style={styles.eventOptionIcon}>📅</Text>
                          <View style={styles.eventDetails}>
                            <Text
                              style={[
                                styles.eventOptionTitle,
                                selectedEvent?.id === event.id &&
                                  styles.eventOptionTitleSelected,
                              ]}
                            >
                              {event.title}
                            </Text>
                            <Text style={styles.eventDateTime}>
                              {dateLabel} • {timeLabel}
                            </Text>
                            {event.location && (
                              <Text style={styles.eventLocation}>
                                📍 {event.location}
                              </Text>
                            )}
                          </View>
                        </View>
                        {selectedEvent?.id === event.id && (
                          <Icon name="check-circle" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {showEmptyEvents && !loadingEvents && (
                    <View style={styles.noEventsContainer}>
                      <Text style={styles.noEventsText}>
                        📅 No upcoming events found
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedEvent(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.generateActionButton,
                  generating && styles.buttonDisabled,
                ]}
                onPress={generateOutfitWithAI}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="auto-awesome" size={20} color="#fff" />
                    <Text style={styles.generateActionButtonText}>
                      Generate
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
});

export default Outfits;

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    // borderBottomWidth: 1,
    // borderBottomColor: "#e5e7eb",
    // backgroundColor: "#fff",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  generateButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  columnWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 16,
  },
  emptyText: {
    color: "#6a7681",
    textAlign: "center",
    marginTop: 30,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#121416",
  },
  closeButton: {
    padding: 4,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 16,
  },
  eventSectionHeader: {
    marginBottom: 12,
  },
  eventLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  timeRangeButtonActive: {
    backgroundColor: "#007AFF",
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  timeRangeTextActive: {
    color: "#fff",
  },
  loadingEventsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingEventsText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  eventOptionsContainer: {
    marginBottom: 12,
  },
  eventOptionsList: {
    minHeight: 200, // Maintain consistent height
  },
  eventOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  eventOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f9ff",
  },
  eventOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventOptionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventOptionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  eventOptionTitleSelected: {
    color: "#007AFF",
  },
  eventDateTime: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 11,
    color: "#9ca3af",
  },
  weatherInfo: {
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  weatherLabel: {
    fontSize: 14,
    color: "#059669",
    textAlign: "center",
    marginBottom: 4,
  },
  weatherDisclaimer: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  noEventsContainer: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  noEventsText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "500",
  },
  generateActionButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  generateActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    zIndex: 1,
  },
  eventOptionsLoading: {
    opacity: 0.7,
  },
  modalLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 12,
  },
  modalLoadingContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
