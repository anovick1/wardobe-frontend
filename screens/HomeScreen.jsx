import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { useWeather } from "../contexts/WeatherContext";
import typography from "../styles/typography";
import globalStyles from "../styles/global";
import { SafeAreaView } from "react-native-safe-area-context";
import DailyOutfitGenerator from "../components/homescreen/outfits/DailyOutfitGenerator";
import * as Calendar from "expo-calendar";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { weather, error: weatherError, city } = useWeather();
  const [calendarPermission, setCalendarPermission] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState([]);

  useEffect(() => {
    requestCalendarPermissions();
  }, []);

  const requestCalendarPermissions = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === "granted") {
        setCalendarPermission(true);
        console.log("✅ Calendar access granted");
        fetchTodaysEvents();
      } else {
        setCalendarPermission(false);
        console.log("❌ Calendar permission denied");
      }
    } catch (err) {
      console.error("❌ Error requesting calendar permission:", err);
    }
  };

  const fetchTodaysEvents = async () => {
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );

      console.log(`📅 Found ${calendars.length} calendars`);

      // Check if we have any calendars (Android issue)
      if (calendars.length === 0) {
        console.log("❌ No calendars found - cannot fetch events");
        setTodaysEvents([]);
        return;
      }

      // Use local timezone, not UTC
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      );

      const allEvents = await Calendar.getEventsAsync(
        calendars.map((c) => c.id),
        startOfDay,
        endOfDay
      );

      // Filter events that overlap with today
      const todayEvents = allEvents.filter((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate || event.startDate);
        return eventStart <= endOfDay && eventEnd >= startOfDay;
      });

      setTodaysEvents(todayEvents);
      console.log(`📅 Found ${todayEvents.length} events for today`);
    } catch (err) {
      console.error("❌ Error fetching today's events:", err);
    }
  };

  return (
    <SafeAreaView
      style={globalStyles.container}
      edges={["top", "left", "right"]}
    >
      <Text style={typography.title}>
        👋 Hi {user?.backend?.name || "there"}!
      </Text>

      {weather && (
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeaderRow}>
            <Text style={styles.weatherEmoji}>
              {weather.weather_description?.toLowerCase().includes("cloud")
                ? "☁️"
                : weather.weather_description?.toLowerCase().includes("rain")
                ? "🌧️"
                : weather.weather_description?.toLowerCase().includes("sun")
                ? "☀️"
                : "🌡️"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.weatherCity}>{city || "Your Location"}</Text>
              <Text style={styles.weatherMain}>
                {weather.weather_description || "Weather"}
              </Text>
            </View>
            <Text style={styles.weatherTemp}>{weather.temperature}°F</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.weatherHintRow}>
            <Text style={styles.weatherHintLabel}>Clothing Tip:</Text>
            <Text style={styles.weatherHint}>{weather.clothing_hint}</Text>
          </View>
        </View>
      )}

      {weatherError && (
        <Text style={[typography.meta, { marginTop: 8 }]}>
          ⚠️ {weatherError}
        </Text>
      )}

      {/* Show today's events if we have any */}
      {todaysEvents.length > 0 && (
        <View style={styles.eventsCard}>
          <Text style={styles.eventsTitle}>📅 Today's Events</Text>
          {todaysEvents.slice(0, 3).map((event) => (
            <Text key={event.id} style={styles.eventItem}>
              • {event.title} at{" "}
              {new Date(event.startDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ))}
          {todaysEvents.length > 3 && (
            <Text style={styles.moreEvents}>
              +{todaysEvents.length - 3} more events
            </Text>
          )}
        </View>
      )}

      <DailyOutfitGenerator
        todaysEvents={todaysEvents}
        calendarPermission={calendarPermission}
      />

      {/* Future: outfit suggestions, upcoming events, feed, etc. */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  weatherCard: {
    marginVertical: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    alignSelf: "stretch",
    minWidth: 0,
  },
  weatherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  weatherEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  weatherCity: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 0,
  },
  weatherMain: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#121416",
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: "700",
    color: "#121416",
    marginLeft: 8,
  },
  weatherDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weatherDetail: {
    fontSize: 13,
    color: "#64748b",
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
    borderRadius: 1,
  },
  weatherHintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginTop: 0,
  },
  weatherHintLabel: {
    fontWeight: "600",
    color: "#059669",
    marginRight: 4,
    fontSize: 11,
  },
  weatherHint: {
    fontSize: 11,
    color: "#121416",
    flex: 1,
    flexWrap: "wrap",
  },
  eventsCard: {
    marginVertical: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    alignSelf: "stretch",
    minWidth: 0,
  },
  eventsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121416",
    marginBottom: 6,
  },
  eventItem: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  moreEvents: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 2,
  },
});
