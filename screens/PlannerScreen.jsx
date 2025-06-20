import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import globalStyles from "../styles/global";
import typography from "../styles/typography";
import WeekView from "../components/planner/WeekView";
import MonthView from "../components/planner/MonthView";
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
          "📅 Calendar access needed to view events. Tap to grant permission."
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
      Calendar.EntityTypes.EVENT
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
        "Please grant calendar access first."
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
        Calendar.EntityTypes.EVENT
      );

      // Check if we have any calendars (Android issue)
      if (calendars.length === 0) {
        console.log("❌ PlannerScreen - No calendars found");
        setEvents([]);
        return;
      }

      const [year, month, day] = dateStr.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59);
      const allEvents = await Calendar.getEventsAsync(
        calendars.map((c) => c.id),
        startOfDay,
        endOfDay
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
  };

  const handleMonthChange = (newDateStr) => {
    setViewDate(newDateStr);
    setSelectedDate(newDateStr);
    if (permissionGranted) {
      fetchEventsForSelectedDate(newDateStr);
    }
  };

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
        <Text style={[typography.title, { marginBottom: 10 }]}>
          🗓️ Outfit Planner
        </Text>

        {/* Show permission status */}
        {permissionGranted === false && (
          <TouchableOpacity
            style={styles.permissionCard}
            onPress={requestCalendarPermissions}
          >
            <Text style={styles.permissionText}>{status}</Text>
          </TouchableOpacity>
        )}

        {renderToggle()}
        <View style={styles.card}>
          {calendarView === CALENDAR_VIEWS.WEEK ? (
            <WeekView
              events={events}
              selectedDate={selectedDate}
              viewDate={viewDate}
              onDaySelect={handleDaySelect}
              onWeekChange={handleWeekChange}
            />
          ) : (
            <MonthView
              events={events}
              selectedDate={selectedDate}
              viewDate={viewDate}
              onDaySelect={handleDaySelect}
              onMonthChange={handleMonthChange}
            />
          )}
          {/* Show events for selected date below calendar */}
          <View style={{ marginTop: 16 }}>
            {events.length > 0 ? (
              <View style={styles.eventListCard}>
                <Text style={styles.eventTitle}>Events on {selectedDate}</Text>
                {events.map((e) => (
                  <Text key={e.id} style={styles.eventItem}>
                    • {e.title} ({new Date(e.startDate).toLocaleTimeString()})
                  </Text>
                ))}
              </View>
            ) : permissionGranted ? (
              <Text style={{ color: "#6a7681", textAlign: "center" }}>
                No events for this day
              </Text>
            ) : (
              <Text style={{ color: "#6a7681", textAlign: "center" }}>
                Grant calendar access to view events
              </Text>
            )}
          </View>
        </View>
        {permissionGranted && selectedDate && (
          <View style={{ marginTop: 20 }}>
            <Button
              title="Add Event for Selected Date"
              onPress={createTestEvent}
            />
          </View>
        )}
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
    marginBottom: 0,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignSelf: "center",
  },
  eventListCard: {
    marginTop: 18,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#121416",
  },
  eventItem: {
    fontSize: 14,
    marginVertical: 2,
    color: "#343A40",
  },
});
