import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import globalStyles from "../styles/global";
import typography from "../styles/typography";
import WeekView from "../components/planner/WeekView";
import MonthView from "../components/planner/MonthView";
import { useOutfits } from "../contexts/OutfitContext";
import { format, startOfWeek, startOfMonth } from "date-fns";
import * as Calendar from "expo-calendar";

const CALENDAR_VIEWS = { WEEK: "week", MONTH: "month" };

export default function PlannerScreen() {
  // Get today's date in local timezone, not UTC
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const isoDate = `${year}-${month}-${day}`;

  const [permissionGranted, setPermissionGranted] = useState(null); // null = not checked yet
  const [status, setStatus] = useState("Checking calendar permissions...");
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [calendarView, setCalendarView] = useState("week");
  const [viewDate, setViewDate] = useState(null);
  const [plannedOutfits, setPlannedOutfits] = useState({});
  const { outfits } = useOutfits();

  useEffect(() => {
    // Check existing permissions without requesting
    checkCalendarPermissions();
    // Use the already calculated isoDate
    setSelectedDate(isoDate);
    setViewDate(isoDate);
  }, []);

  useEffect(() => {
    // Fetch events when permission is granted and we have a selected date
    if (permissionGranted && selectedDate) {
      fetchEventsForSelectedDate(selectedDate);
    }
  }, [permissionGranted, selectedDate]);

  const checkCalendarPermissions = async () => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        setStatus("✅ Calendar access granted.");
      } else {
        setPermissionGranted(false);
        setStatus(
          "📅 Calendar access needed to view events. Tap to grant permission.",
        );
      }
    } catch (err) {
      setPermissionGranted(false);
      setStatus("❌ Error checking calendar permission.");
    }
  };

  const requestCalendarPermissions = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        setStatus("✅ Calendar access granted.");
        if (selectedDate) {
          fetchEventsForSelectedDate(selectedDate);
        }
      } else {
        setPermissionGranted(false);
        setStatus("❌ Calendar permission denied.");
      }
    } catch (err) {
      setStatus("❌ Error requesting calendar permission.");
    }
  };

  const getWritableCalendarId = async () => {
    if (!permissionGranted) throw new Error("Calendar permission not granted");
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );
    const writable = calendars.find((c) => c.allowsModifications);
    if (!writable) throw new Error("No writable calendar found");
    return writable.id;
  };

  const createTestEvent = async () => {
    if (!selectedDate) {
      Alert.alert("Please select a date first.");
      return;
    }
    if (!permissionGranted) {
      Alert.alert(
        "Calendar permission needed",
        "Please grant calendar access first.",
      );
      return;
    }
    try {
      const calendarId = await getWritableCalendarId();
      const [year, month, day] = selectedDate.split("-").map(Number);
      const startDate = new Date(year, month - 1, day, 10, 0);
      const endDate = new Date(year, month - 1, day, 11, 0);
      await Calendar.createEventAsync(calendarId, {
        title: "Test Outfit Plan",
        startDate,
        endDate,
        alarms: [{ relativeOffset: -10 }],
      });
      Alert.alert("✅ Event created!");
      fetchEventsForSelectedDate(selectedDate);
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  const normalizeDateString = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  };

  const fetchEventsForSelectedDate = async (dateStr) => {
    if (!permissionGranted) return;
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );

      // Check if we have any calendars (Android issue)
      if (calendars.length === 0) {
        setEvents([]);
        return;
      }

      const [year, month, day] = dateStr.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59);
      const allEvents = await Calendar.getEventsAsync(
        calendars.map((c) => c.id),
        startOfDay,
        endOfDay,
      );
      // Show all events that overlap the day
      const filteredEvents = allEvents.filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate || event.startDate);
        return eventStart <= endOfDay && eventEnd >= startOfDay;
      });
      setEvents(filteredEvents);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not load events.");
    }
  };

  const handleDaySelect = (dateStr) => {
    setSelectedDate(dateStr);
    setViewDate(dateStr);
    if (permissionGranted) {
      fetchEventsForSelectedDate(dateStr);
    }
  };

  const handleWeekChange = (newDateStr) => {
    setViewDate(newDateStr);
    // Select the first day of the new week
    const newDate = new Date(newDateStr);
    const weekStart = startOfWeek(newDate, { weekStartsOn: 0 });
    const firstDayStr = format(weekStart, "yyyy-MM-dd");
    setSelectedDate(firstDayStr);
    if (permissionGranted) {
      fetchEventsForSelectedDate(firstDayStr);
    }
  };

  const handleMonthChange = (newDateStr) => {
    setViewDate(newDateStr);
    // Select the first day of the new month
    const [year, month] = newDateStr.split("-").map(Number);
    const firstDayStr = `${year}-${String(month).padStart(2, "0")}-01`;
    setSelectedDate(firstDayStr);
    if (permissionGranted) {
      fetchEventsForSelectedDate(firstDayStr);
    }
  };

  // Helper functions for outfit data
  const getWornOutfitsForWeek = () => {
    return outfits
      .filter((outfit) => outfit.is_worn && outfit.last_worn_at)
      .reduce((acc, outfit) => {
        const wornDate = outfit.last_worn_at.split("T")[0];
        if (!acc[wornDate]) acc[wornDate] = [];
        acc[wornDate].push(outfit);
        return acc;
      }, {});
  };

  const getWornOutfitsForMonth = () => {
    return getWornOutfitsForWeek(); // Same logic for now
  };

  const getOutfitsForDate = (dateStr) => {
    const wornOutfits = outfits.filter(
      (outfit) =>
        outfit.is_worn &&
        outfit.last_worn_at &&
        outfit.last_worn_at.split("T")[0] === dateStr,
    );
    const plannedOutfitsForDate = plannedOutfits[dateStr] || [];
    return { worn: wornOutfits, planned: plannedOutfitsForDate };
  };

  const renderDayDetail = () => {
    const { worn, planned } = getOutfitsForDate(selectedDate);
    const hasEvents = events.length > 0;
    const hasContent = worn.length > 0 || planned.length > 0 || hasEvents;

    if (!hasContent && !permissionGranted) {
      return (
        <View style={styles.dayDetailCard}>
          <Text style={styles.dayDetailTitle}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.emptyStateText}>
            Grant calendar access to view events and plan outfits
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.dayDetailCard}>
        <Text style={styles.dayDetailTitle}>
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>

        {/* Worn Outfits */}
        {worn.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="check-circle" size={16} color="#10b981" />
              <Text style={styles.sectionTitle}>Worn Outfits</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.outfitsList}
            >
              {worn.map((outfit) => (
                <View key={outfit.id} style={styles.miniOutfitCard}>
                  {outfit.composite_image_url ? (
                    <Image
                      source={{ uri: outfit.composite_image_url }}
                      style={styles.miniOutfitImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View
                      style={[styles.miniOutfitImage, styles.placeholderImage]}
                    >
                      <Icon name="style" size={20} color="#ccc" />
                    </View>
                  )}
                  <Text style={styles.miniOutfitTitle} numberOfLines={1}>
                    {outfit.title || "Untitled"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Planned Outfits */}
        {planned.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="schedule" size={16} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Planned Outfits</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.outfitsList}
            >
              {planned.map((outfit) => (
                <View key={outfit.id} style={styles.miniOutfitCard}>
                  <Image
                    source={{ uri: outfit.composite_image_url }}
                    style={styles.miniOutfitImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.miniOutfitTitle} numberOfLines={1}>
                    {outfit.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Events */}
        {hasEvents && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="event" size={16} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Calendar Events</Text>
            </View>
            {events.map((e) => (
              <View key={e.id} style={styles.eventItem}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventTime}>
                  {new Date(e.startDate).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!hasContent && (
          <Text style={styles.emptyStateText}>
            No outfits or events for this day
          </Text>
        )}
      </View>
    );
  };

  const renderFutureFeatures = () => (
    <View style={styles.futureFeatures}>
      <Text style={styles.featuresTitle}>Coming Soon</Text>
      <View style={styles.featureCard}>
        <View style={styles.featureHeader}>
          <Icon name="group" size={20} color="#ec4899" />
          <Text style={styles.featureTitle}>Shared Events</Text>
        </View>
        <Text style={styles.featureDescription}>
          Collaborate with friends on outfit planning for shared events and
          occasions
        </Text>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureHeader}>
          <Icon name="luggage" size={20} color="#06b6d4" />
          <Text style={styles.featureTitle}>Smart Packing Lists</Text>
        </View>
        <Text style={styles.featureDescription}>
          Auto-generate packing lists with weather-appropriate items and trip
          essentials
        </Text>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureHeader}>
          <Icon name="shopping-bag" size={20} color="#10b981" />
          <Text style={styles.featureTitle}>Outfit Completion</Text>
        </View>
        <Text style={styles.featureDescription}>
          Smart suggestions for missing pieces to complete your planned outfits
        </Text>
      </View>
    </View>
  );

  const renderToggle = () => (
    <View style={styles.toggleRow}>
      {Object.entries(CALENDAR_VIEWS).map(([key, value]) => (
        <TouchableOpacity
          key={value}
          style={[
            styles.togglePill,
            calendarView === value && styles.togglePillActive,
          ]}
          onPress={() => {
            setCalendarView(value);
            setSelectedDate(isoDate);
            setViewDate(isoDate);
            if (permissionGranted) {
              fetchEventsForSelectedDate(isoDate);
            }
          }}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.toggleText,
              calendarView === value && styles.toggleTextActive,
            ]}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView
      style={globalStyles.container}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[typography.title, styles.headerTitle]}>
            Outfit Planner
          </Text>
          <Text style={styles.headerSubtitle}>
            Plan your looks and track worn outfits
          </Text>
        </View>

        {/* Show permission status */}
        {permissionGranted === false && (
          <TouchableOpacity
            style={styles.permissionCard}
            onPress={requestCalendarPermissions}
          >
            <Text style={styles.permissionText}>{status}</Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => {
              setSelectedDate(isoDate);
              setViewDate(isoDate);
              if (permissionGranted) {
                fetchEventsForSelectedDate(isoDate);
              }
            }}
          >
            <Icon name="today" size={20} color="#fff" />
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>

          <View style={styles.createButtons}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                // navigation.navigate('CreateEvent');
                Alert.alert(
                  "Coming Soon",
                  "Event creation will be available soon!",
                );
              }}
            >
              <Icon name="add-circle" size={18} color="#3b82f6" />
              <Text style={styles.createButtonText}>Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                // navigation.navigate('CreateTrip');
                Alert.alert(
                  "Coming Soon",
                  "Trip planning will be available soon!",
                );
              }}
            >
              <Icon name="luggage" size={18} color="#8b5cf6" />
              <Text style={styles.createButtonText}>Trip</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderToggle()}
        <View style={styles.card}>
          {calendarView === CALENDAR_VIEWS.WEEK ? (
            <WeekView
              events={events}
              selectedDate={selectedDate}
              viewDate={viewDate}
              onDaySelect={handleDaySelect}
              onWeekChange={handleWeekChange}
              wornOutfits={getWornOutfitsForWeek()}
              plannedOutfits={plannedOutfits}
            />
          ) : (
            <MonthView
              events={events}
              selectedDate={selectedDate}
              viewDate={viewDate}
              onDaySelect={handleDaySelect}
              onMonthChange={handleMonthChange}
              wornOutfits={getWornOutfitsForMonth()}
              plannedOutfits={plannedOutfits}
            />
          )}
        </View>

        {/* Day Detail Section */}
        {selectedDate && renderDayDetail()}

        {/* Future Features Preview */}
        {renderFutureFeatures()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
    maxWidth: 420,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#121416",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6a7681",
    textAlign: "center",
  },
  permissionCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f59e0b",
    width: "100%",
    maxWidth: 420,
  },
  permissionText: {
    color: "#92400e",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  togglePill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginHorizontal: 2,
  },
  togglePillActive: {
    backgroundColor: "#121416",
  },
  toggleText: {
    color: "#121416",
    fontWeight: "500",
    fontSize: 15,
  },
  toggleTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 0,
    marginBottom: 20,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignSelf: "center",
  },
  dayDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignSelf: "center",
  },
  dayDetailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#121416",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginLeft: 8,
  },
  outfitsList: {
    flexDirection: "row",
  },
  miniOutfitCard: {
    alignItems: "center",
    marginRight: 12,
    width: 70,
  },
  miniOutfitImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 6,
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  miniOutfitTitle: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
  },
  emptyStateText: {
    color: "#6a7681",
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
    width: "100%",
    maxWidth: 420,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121416",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  todayButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  createButtons: {
    flexDirection: "row",
    gap: 12,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  futureFeatures: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    marginTop: 12,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#121416",
    marginBottom: 16,
    textAlign: "center",
  },
  featureCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#121416",
    marginLeft: 10,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6a7681",
    lineHeight: 20,
  },
});
