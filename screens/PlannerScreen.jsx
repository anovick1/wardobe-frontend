import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  Platform,
  StyleSheet,
  ScrollView,
} from "react-native";
import * as Calendar from "expo-calendar";
import { Calendar as RNCalendar } from "react-native-calendars";

export default function PlannerScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [status, setStatus] = useState("Waiting for permission...");
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    requestCalendarPermissions();
    const today = new Date();
    const isoDate = today.toISOString().split("T")[0];
    setSelectedDate(isoDate);
    fetchEventsForSelectedDate(isoDate);
  }, []);

  const requestCalendarPermissions = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      console.log("📆 Calendar permission status:", status);

      if (status === "granted") {
        setPermissionGranted(true);
        setStatus("✅ Calendar access granted.");
      } else {
        setPermissionGranted(false);
        setStatus("❌ Calendar permission denied.");
      }
    } catch (err) {
      console.error("❌ Permission error:", err);
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

    try {
      const calendarId = await getWritableCalendarId();
      const [year, month, day] = selectedDate.split("-").map(Number);
      const startDate = new Date(year, month - 1, day, 10, 0);
      const endDate = new Date(year, month - 1, day, 11, 0);

      await Calendar.createEventAsync(calendarId, {
        title: "Test Outfit Plan",
        startDate,
        endDate,
        // timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -10 }],
      });

      Alert.alert("✅ Event created!");
      fetchEventsForSelectedDate(selectedDate);
    } catch (err) {
      console.error("❌ Failed to create event:", err);
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

      const [year, month, day] = dateStr.split("-").map(Number);
      const selected = new Date(year, month - 1, day);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

      const allEvents = await Calendar.getEventsAsync(
        calendars.map((c) => c.id),
        startOfDay,
        endOfDay
      );

      const selectedDateNormalized = normalizeDateString(selected);

      const filteredEvents = allEvents.filter((event) => {
        const eventDateNormalized = normalizeDateString(event.startDate);
        return eventDateNormalized === selectedDateNormalized;
      });

      setEvents(filteredEvents);
    } catch (err) {
      console.error("❌ Failed to fetch events:", err);
      Alert.alert("Error", err.message || "Could not load events.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🗓️ Outfit Planner</Text>
      <Text style={styles.status}>{status}</Text>

      <RNCalendar
        onDayPress={(day) => {
          console.log("📅 Selected date:", day.dateString);
          setSelectedDate(day.dateString);
          fetchEventsForSelectedDate(day.dateString);
        }}
        markedDates={
          selectedDate
            ? {
                [selectedDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: "#000",
                },
              }
            : {}
        }
      />

      {!selectedDate && (
        <Text style={{ textAlign: "center", marginTop: 10 }}>
          📅 Tap a date to view or add events
        </Text>
      )}

      {permissionGranted && selectedDate && (
        <View style={{ marginTop: 20 }}>
          <Button
            title="Add Event for Selected Date"
            onPress={createTestEvent}
          />
        </View>
      )}

      {events.length > 0 && (
        <View style={{ marginTop: 30, width: "100%" }}>
          <Text style={styles.eventTitle}>Events on {selectedDate}</Text>
          {events.map((e) => (
            <Text key={e.id} style={styles.eventItem}>
              • {e.title} ({new Date(e.startDate).toLocaleTimeString()})
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  status: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  eventItem: {
    fontSize: 14,
    marginVertical: 2,
  },
});
