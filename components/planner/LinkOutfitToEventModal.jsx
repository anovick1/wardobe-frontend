import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { eventsAPI } from "../../api";

export default function LinkOutfitToEventModal({
  visible,
  onClose,
  outfitId,
  onEventLinked,
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchEvents();
    }
  }, [visible]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getEvents({
        per_page: 50,
      });
      // Sort events by date
      const sortedEvents = (response.events || []).sort(
        (a, b) => new Date(a.datetime) - new Date(b.datetime)
      );
      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkOutfit = async () => {
    if (!selectedEventId) {
      Alert.alert("Error", "Please select an event");
      return;
    }

    setLinking(true);
    try {
      await eventsAPI.linkOutfitToEvent(selectedEventId, outfitId);
      Alert.alert("Success", "Outfit linked to event successfully!");
      if (onEventLinked) {
        onEventLinked();
      }
      onClose();
    } catch (error) {
      console.error("Error linking outfit to event:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to link outfit to event"
      );
    } finally {
      setLinking(false);
    }
  };

  const formatEventDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEventUpcoming = (datetime) => {
    return new Date(datetime) >= new Date();
  };

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
          <Text style={styles.headerTitle}>Link to Event</Text>
          <TouchableOpacity
            onPress={handleLinkOutfit}
            style={[
              styles.linkButton,
              (!selectedEventId || linking) && styles.linkButtonDisabled,
            ]}
            disabled={!selectedEventId || linking}
          >
            {linking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.linkButtonText}>Link</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Events List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="event" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptyText}>
              Create an event first to link this outfit
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Select an Event</Text>
            {events.map((event) => {
              const isUpcoming = isEventUpcoming(event.datetime);
              const isSelected = selectedEventId === event.id;

              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventCard,
                    isSelected && styles.eventCardSelected,
                    !isUpcoming && styles.eventCardPast,
                  ]}
                  onPress={() => setSelectedEventId(event.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventCardContent}>
                    <View style={styles.eventInfo}>
                      <Text
                        style={[
                          styles.eventTitle,
                          isSelected && styles.eventTitleSelected,
                        ]}
                      >
                        {event.title}
                      </Text>
                      <Text
                        style={[
                          styles.eventDate,
                          isSelected && styles.eventDateSelected,
                        ]}
                      >
                        {formatEventDate(event.datetime)}
                      </Text>
                      {event.location && (
                        <Text
                          style={[
                            styles.eventLocation,
                            isSelected && styles.eventLocationSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {event.location}
                        </Text>
                      )}
                      {event.scheduled_outfits_count > 0 && (
                        <Text style={styles.outfitCount}>
                          {event.scheduled_outfits_count} outfit
                          {event.scheduled_outfits_count > 1 ? "s" : ""} already
                          linked
                        </Text>
                      )}
                    </View>
                    <View style={styles.eventSelection}>
                      {isSelected ? (
                        <Icon name="check-circle" size={24} color="#3b82f6" />
                      ) : (
                        <Icon
                          name="radio-button-unchecked"
                          size={24}
                          color="#9ca3af"
                        />
                      )}
                    </View>
                  </View>
                  {!isUpcoming && (
                    <View style={styles.pastBadge}>
                      <Text style={styles.pastBadgeText}>Past Event</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
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
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  eventCardSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  eventCardPast: {
    opacity: 0.6,
  },
  eventCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 4,
  },
  eventTitleSelected: {
    color: "#1e40af",
  },
  eventDate: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  eventDateSelected: {
    color: "#3b82f6",
  },
  eventLocation: {
    fontSize: 13,
    color: "#9ca3af",
    fontStyle: "italic",
    marginBottom: 4,
  },
  eventLocationSelected: {
    color: "#60a5fa",
  },
  outfitCount: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 4,
  },
  eventSelection: {
    marginTop: 2,
  },
  pastBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pastBadgeText: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: "500",
  },
});