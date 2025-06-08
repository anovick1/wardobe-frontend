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
  }, []);

  const requestCalendarPermissions = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status === "granted") {
      setPermissionGranted(true);
      setStatus("✅ Calendar access granted.");
    } else {
      setPermissionGranted(false);
      setStatus("❌ Calendar permission denied.");
    }
  };

  const getDefaultCalendarSource = async () => {
    if (Platform.OS === "ios") {
      const sources = await Calendar.getSourcesAsync();
      const defaultSource = sources.find((s) => s.name === "Default");
      return defaultSource || sources[0];
    } else {
      const calendars = await Calendar.getCalendarsAsync();
      return calendars[0].source;
    }
  };

  const createTestEvent = async () => {
    if (!selectedDate) {
      Alert.alert("Please select a date first.");
      return;
    }

    try {
      const source = await getDefaultCalendarSource();
      const calendarId = await Calendar.createCalendarAsync({
        title: "Wardrobe Planner",
        color: "#00AAFF",
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: Platform.OS === "ios" ? source.id : undefined,
        source,
        name: "Wardrobe",
        ownerAccount: "personal",
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      const [year, month, day] = selectedDate.split("-").map(Number);
      const startDate = new Date(year, month - 1, day, 10, 0); // 10 AM
      const endDate = new Date(year, month - 1, day, 11, 0); // 11 AM

      await Calendar.createEventAsync(calendarId, {
        title: "Test Outfit Plan",
        startDate,
        endDate,
        timeZone: "local",
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
