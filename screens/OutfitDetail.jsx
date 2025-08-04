import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import { useOutfits } from "../contexts/OutfitContext";
import { dataManager } from "../services/DataManager";
import api, { wornOutfitAPI, eventsAPI } from "../api";
import { SafeAreaView } from "react-native-safe-area-context";
import MonthView from "../components/planner/MonthView";
import LinkOutfitToEventModal from "../components/planner/LinkOutfitToEventModal";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  format,
} from "date-fns";

const OutfitDetail = () => {
  let route;
  let routeParams = {};
  let navigation;

  try {
    route = useRoute();
    navigation = useNavigation();
    routeParams = route?.params || {};
  } catch (error) {
    console.error("Navigation context error:", error);
    routeParams = {};
    // Return early if navigation context is broken
    return (
      <SafeAreaView
        style={styles.errorContainer}
        edges={["top", "left", "right"]}
      >
        <Text style={styles.errorText}>
          Navigation error. Please restart the app.
        </Text>
      </SafeAreaView>
    );
  }

  const {
    outfit: initialOutfit,
    outfitId: paramOutfitId,
    fromHome,
  } = routeParams;
  const [outfit, setOutfit] = useState(null);
  const outfitId = initialOutfit?.id || paramOutfitId;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { user } = useContext(AuthContext);
  const { removeOutfit, addOutfit, updateOutfitWornStatus } = useOutfits();

  // Worn outfit management state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    return today;
  });
  const [viewMonth, setViewMonth] = useState(new Date());
  const [markingAsWorn, setMarkingAsWorn] = useState(false);
  const [wornRecords, setWornRecords] = useState([]);
  const [loadingWornRecords, setLoadingWornRecords] = useState(false);
  const [copying, setCopying] = useState(false);
  const [showLinkEventModal, setShowLinkEventModal] = useState(false);

  const fetchOutfitDetails = async () => {
    if (!user || !outfitId) return;
    try {
      setLoading(true);
      const response = await api.get(`/outfits/${outfitId}?include_items=true`);
      setOutfit(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load outfit details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Daily outfits cannot be edited directly since they're AI-generated.
  // Instead, we copy the outfit and allow editing the copy.
  // Daily outfits also cannot be deleted to preserve the AI-generated suggestions.
  const handleCopyAndEdit = async () => {
    try {
      setCopying(true);
      const copyResult = await dataManager.copyOutfit(outfitId);
      Alert.alert("Success", "Outfit copied successfully!", [
        {
          text: "Edit Copy",
          onPress: () =>
            navigation.navigate("EditOutfit", {
              outfitId: copyResult.outfit.id,
            }),
        },
        {
          text: "View Copy",
          onPress: () =>
            navigation.navigate("OutfitDetail", {
              outfit: copyResult.outfit,
            }),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to copy outfit");
      console.error(error);
    } finally {
      setCopying(false);
    }
  };

  // Always fetch to get complete data including wardrobe items
  useEffect(() => {
    if (user && outfitId) {
      fetchOutfitDetails();
      // Add delay to avoid race condition
      setTimeout(() => {
        fetchWornRecords();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, outfitId]);

  // TODO: Add selective refetch when returning from EditOutfit if needed
  // useFocusEffect removed to prevent API spam

  const handleDeleteOutfit = async () => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await api.delete(`/outfits/${outfitId}`);
              removeOutfit(outfitId);
              Alert.alert("Success", "Outfit deleted successfully");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete outfit");
              console.error(error);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Worn outfit management functions
  const fetchWornRecords = async () => {
    if (!outfitId) return;
    try {
      setLoadingWornRecords(true);
      const allWornOutfits = await wornOutfitAPI.getWornOutfits();
      const outfitWornRecords = allWornOutfits.filter(
        (worn) => worn.outfit && worn.outfit.id === outfitId
      );
      setWornRecords(outfitWornRecords);
    } catch (error) {
      console.error("❌ Failed to fetch worn records:", error);
      // Don't fail silently - continue with empty records
      setWornRecords([]);
    } finally {
      setLoadingWornRecords(false);
    }
  };

  const handleMarkAsWorn = async () => {
    try {
      setMarkingAsWorn(true);
      await wornOutfitAPI.markAsWorn(outfitId, selectedDate);

      // Update outfit context
      updateOutfitWornStatus(outfitId, true);

      // Refresh outfit details and worn records
      await Promise.all([fetchOutfitDetails(), fetchWornRecords()]);

      setShowDatePicker(false);
      Alert.alert(
        "Success",
        `Outfit marked as worn for ${selectedDate.toLocaleDateString()}!`
      );
    } catch (error) {
      console.error("Failed to mark outfit as worn:", error);
      Alert.alert("Error", "Failed to mark outfit as worn. Please try again.");
    } finally {
      setMarkingAsWorn(false);
    }
  };

  const handleRemoveWornRecord = async (wornRecordId) => {
    Alert.alert(
      "Remove Worn Record",
      "Are you sure you want to remove this worn record?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await wornOutfitAPI.removeWornRecord(wornRecordId);

              // Refresh outfit details and worn records
              await Promise.all([fetchOutfitDetails(), fetchWornRecords()]);

              // Update context if no more worn records
              const remainingRecords = wornRecords.filter(
                (r) => r.id !== wornRecordId
              );
              if (remainingRecords.length === 0) {
                updateOutfitWornStatus(outfitId, false);
              }

              Alert.alert("Success", "Worn record removed successfully");
            } catch (error) {
              console.error("Failed to remove worn record:", error);
              Alert.alert(
                "Error",
                "Failed to remove worn record. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (loading && !outfit) {
    return (
      <SafeAreaView
        style={{ backgroundColor: "#fff", flex: 1 }}
        edges={["top", "left", "right"]}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Outfit Details</Text>
            <View style={styles.headerActions} />
          </View>

          <ScrollView style={styles.content}>
            {/* Loading skeleton */}
            <View style={styles.loadingSkeletonContainer}>
              <View style={styles.loadingSkeletonTitle} />
              <View style={styles.loadingSkeletonSubtitle} />
            </View>

            <View style={styles.loadingSkeletonImageContainer}>
              <View style={styles.loadingSkeletonImage}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingSkeletonText}>
                  Loading outfit...
                </Text>
              </View>
            </View>

            <View style={styles.loadingSkeletonSection}>
              <View style={styles.loadingSkeletonSectionTitle} />
              <View style={styles.loadingSkeletonItems}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.loadingSkeletonItem} />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (!outfit) {
    return (
      <SafeAreaView
        style={styles.errorContainer}
        edges={["top", "left", "right"]}
      >
        <Text style={styles.errorText}>Outfit not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ backgroundColor: "#fff", flex: 1 }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              navigation.goBack();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            pointerEvents="auto"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title} pointerEvents="none">
            Outfit Details
          </Text>
          <View style={styles.headerActions} pointerEvents="box-none">
            {outfit?.is_daily_outfit ? (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyAndEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                pointerEvents="auto"
              >
                <Ionicons name="copy" size={24} color="#007AFF" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate("EditOutfit", { outfit })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  pointerEvents="auto"
                >
                  <Ionicons name="pencil" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteOutfit}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  pointerEvents="auto"
                >
                  <Ionicons name="trash-outline" size={24} color="#ff3b30" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Daily Outfit Notice */}
          {outfit?.is_daily_outfit && (
            <View style={styles.dailyOutfitNoticeContainer}>
              <View style={styles.dailyOutfitNote}>
                <Ionicons name="information-circle" size={16} color="#007AFF" />
                <Text style={styles.dailyOutfitNoteText}>
                  Daily outfits can't be edited or deleted. Use the copy button
                  to create an editable version.
                </Text>
              </View>
            </View>
          )}

          {/* Outfit Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.outfitTitle}>
              {outfit.title || "Untitled Outfit"}
            </Text>
            <Text style={styles.itemCount}>
              {outfit.wardrobe_items?.length || 0}{" "}
              {(outfit.wardrobe_items?.length || 0) === 1 ? "item" : "items"}
            </Text>
          </View>

          {/* Outfit Composite Image */}
          <View style={styles.outfitImageContainer}>
            {outfit.composite_image_url || outfit.composite_image_url ? (
              <Image
                source={{
                  uri: outfit.composite_image_url || outfit.composite_image_url,
                }}
                style={styles.outfitImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="image-outline" size={80} color="#ccc" />
                <Text style={styles.placeholderText}>No outfit image</Text>
              </View>
            )}
          </View>

          {/* AI Explanation (if available) */}
          {outfit.explanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationLabel}>AI Stylist Notes</Text>
              <Text style={styles.explanationText}>{outfit.explanation}</Text>
            </View>
          )}

          {/* Notes */}
          {outfit.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{outfit.notes}</Text>
            </View>
          )}

          {/* Wardrobe Items Carousel */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsSectionLabel}>Items in this outfit</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsCarousel}
            >
              {(outfit.wardrobe_items || []).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    { marginLeft: index === 0 ? 0 : 12 },
                  ]}
                  onPress={() =>
                    navigation.navigate("WardrobeItemDetail", { item })
                  }
                >
                  <Image
                    source={{
                      uri: item.composite_image_url || item.image_url,
                    }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.brand && (
                      <Text style={styles.itemBrand} numberOfLines={1}>
                        {item.brand}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Linked Events Section */}
          {outfit.linked_events && outfit.linked_events.length > 0 && (
            <View style={styles.eventsSection}>
              <Text style={styles.eventsSectionLabel}>Linked Events</Text>
              <View style={styles.eventsContainer}>
                {outfit.linked_events.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                      <Text style={styles.eventTitle}>{event.title}</Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventDateTime}>
                        {new Date(event.datetime).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {event.location && (
                        <Text style={styles.eventLocation} numberOfLines={1}>
                          {event.location}
                        </Text>
                      )}
                    </View>
                    {event.status === "planned" && (
                      <View style={styles.eventStatusBadge}>
                        <Text style={styles.eventStatusText}>Planned</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags Section */}
          {outfit.tags && outfit.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsSectionLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {outfit.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Link to Event Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.linkEventButton}
              onPress={() => setShowLinkEventModal(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
              <Text style={styles.linkEventButtonText}>Link to Event</Text>
            </TouchableOpacity>
          </View>

          {/* Worn Outfit Management */}
          <View style={styles.wornSection}>
            <View style={styles.wornSectionHeader}>
              <Text style={styles.wornSectionLabel}>Worn History</Text>
              <TouchableOpacity
                style={styles.addWornButton}
                onPress={() => setShowDatePicker(true)}
                disabled={markingAsWorn}
              >
                {markingAsWorn ? (
                  <ActivityIndicator size={16} color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="add" size={16} color="#007AFF" />
                    <Text style={styles.addWornButtonText}>Mark as Worn</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {loadingWornRecords ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading worn records...</Text>
              </View>
            ) : wornRecords.length > 0 ? (
              <View style={styles.wornRecordsList}>
                {wornRecords
                  .sort((a, b) => new Date(b.worn_at) - new Date(a.worn_at))
                  .map((record, index) => {
                    const wornDate = new Date(record.worn_at);
                    const today = new Date();

                    // Set both dates to noon to avoid timezone issues when comparing
                    const wornDateNormalized = new Date(wornDate);
                    wornDateNormalized.setHours(12, 0, 0, 0);

                    const todayNormalized = new Date(today);
                    todayNormalized.setHours(12, 0, 0, 0);

                    const isToday =
                      wornDateNormalized.getTime() ===
                      todayNormalized.getTime();
                    const isFuture =
                      wornDateNormalized.getTime() > todayNormalized.getTime();

                    return (
                      <View key={record.id} style={styles.wornRecord}>
                        <View style={styles.wornRecordContent}>
                          <Ionicons
                            name={
                              isFuture ? "calendar-outline" : "checkmark-circle"
                            }
                            size={16}
                            color={isFuture ? "#ff9500" : "#10b981"}
                          />
                          <View style={styles.wornRecordInfo}>
                            <Text style={styles.wornRecordDate}>
                              {isToday
                                ? "Worn today"
                                : isFuture
                                ? `Planned for ${wornDate.toLocaleDateString()}`
                                : `Worn on ${wornDate.toLocaleDateString()}`}
                            </Text>
                            <Text style={styles.wornRecordTime}>
                              {wornDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.removeWornButton}
                          onPress={() => handleRemoveWornRecord(record.id)}
                        >
                          <Ionicons name="close" size={16} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            ) : (
              <View style={styles.noWornRecords}>
                <Ionicons name="shirt-outline" size={32} color="#ccc" />
                <Text style={styles.noWornRecordsText}>
                  No worn records yet. Tap "Mark as Worn" to start tracking!
                </Text>
              </View>
            )}
          </View>

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataLabel}>
              {outfit.generated_by === "chatgpt"
                ? "Created by AI"
                : "Created by You"}
            </Text>
            <Text style={styles.metadataText}>
              {new Date(outfit.created_at).toLocaleString()}
            </Text>
          </View>
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Select Date Worn</Text>
                  <TouchableOpacity
                    onPress={handleMarkAsWorn}
                    style={[styles.modalButton, styles.confirmButton]}
                    disabled={markingAsWorn}
                  >
                    <Text
                      style={[styles.modalButtonText, styles.confirmButtonText]}
                    >
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.datePickerLabel}>
                      Selected: {format(selectedDate, "MMMM d, yyyy")}
                    </Text>
                    <TouchableOpacity
                      style={styles.todayButton}
                      onPress={() => {
                        const today = new Date();
                        today.setHours(12, 0, 0, 0);
                        setSelectedDate(today);
                        setViewMonth(today);
                      }}
                    >
                      <Ionicons name="today" size={16} color="#007AFF" />
                      <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                  <MonthView
                    selectedDate={format(selectedDate, "yyyy-MM-dd")}
                    viewDate={format(viewMonth, "yyyy-MM-dd")}
                    onDaySelect={(date) => {
                      // Parse the date string properly to avoid timezone issues
                      const [year, month, day] = date.split("-").map(Number);
                      const newDate = new Date(
                        year,
                        month - 1,
                        day,
                        12,
                        0,
                        0,
                        0
                      );
                      setSelectedDate(newDate);
                    }}
                    onMonthChange={(newDateString) => {
                      if (newDateString) {
                        // Parse the date string properly
                        const [year, month, day] = newDateString
                          .split("-")
                          .map(Number);
                        const newViewMonth = new Date(year, month - 1, day);
                        setViewMonth(newViewMonth);

                        // Set selected date to first day of the new month (same logic as PlannerScreen)
                        const firstDayStr = `${year}-${String(month).padStart(
                          2,
                          "0"
                        )}-01`;
                        const [firstYear, firstMonth, firstDay] = firstDayStr
                          .split("-")
                          .map(Number);
                        const newSelectedDate = new Date(
                          firstYear,
                          firstMonth - 1,
                          firstDay,
                          12,
                          0,
                          0,
                          0
                        );
                        setSelectedDate(newSelectedDate);
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {copying && (
          <View style={styles.copyingOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.copyingText}>Copying outfit...</Text>
          </View>
        )}

        {deleting && (
          <View style={styles.deletingOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.deletingText}>Deleting outfit...</Text>
          </View>
        )}

        {/* Link to Event Modal */}
        <LinkOutfitToEventModal
          visible={showLinkEventModal}
          onClose={() => setShowLinkEventModal(false)}
          outfitId={outfitId}
          onEventLinked={() => {
            fetchOutfitDetails();
          }}
        />
      </View>
    </SafeAreaView>
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
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    zIndex: 10,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  editButton: {
    padding: 8,
    marginRight: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  copyButton: {
    padding: 8,
    marginRight: 8,
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
  content: {
    flex: 1,
  },
  outfitImageContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
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
  outfitImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f8f9fa",
  },
  placeholderContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  metadataContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  metadataLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 14,
    color: "#666",
  },
  explanationContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  explanationLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#007AFF",
  },
  explanationText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  notesContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  itemsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  itemsSectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  itemsCarousel: {
    paddingHorizontal: 16,
  },
  itemCard: {
    width: 120,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  itemInfo: {
    padding: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 10,
    color: "#666",
  },
  titleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  outfitTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  dailyOutfitNoticeContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dailyOutfitNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  dailyOutfitNoteText: {
    fontSize: 13,
    color: "#0369a1",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  eventsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  eventsSectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  eventsContainer: {
    paddingHorizontal: 16,
  },
  eventCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#121416",
    marginLeft: 8,
    flex: 1,
  },
  eventDetails: {
    marginLeft: 24,
  },
  eventDateTime: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
  },
  eventStatusBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
    marginLeft: 24,
  },
  eventStatusText: {
    fontSize: 11,
    color: "#3b82f6",
    fontWeight: "500",
  },
  tagsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  tagsSectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: "#666",
  },
  // Worn outfit styles
  actionSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  linkEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#3b82f6",
    gap: 8,
  },
  linkEventButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  wornSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  wornSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  wornSectionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  addWornButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  addWornButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  wornRecordsList: {
    paddingHorizontal: 16,
  },
  wornRecord: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  wornRecordContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  wornRecordInfo: {
    marginLeft: 12,
    flex: 1,
  },
  wornRecordDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  wornRecordTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  removeWornButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#fee",
  },
  noWornRecords: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  noWornRecordsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34, // Safe area
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  // Calendar container styles
  calendarContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  todayButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 4,
  },
  // Loading skeleton styles
  loadingSkeletonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingSkeletonTitle: {
    height: 28,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
    width: "70%",
  },
  loadingSkeletonSubtitle: {
    height: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    width: "40%",
  },
  loadingSkeletonImageContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
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
  loadingSkeletonImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingSkeletonText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  loadingSkeletonSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
  },
  loadingSkeletonSectionTitle: {
    height: 20,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    width: "50%",
  },
  loadingSkeletonItems: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingSkeletonItem: {
    width: 120,
    height: 140,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  copyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  copyingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  deletingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  deletingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
});

export default OutfitDetail;
