import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { useWeather } from "../contexts/WeatherContext";
import typography from "../styles/typography";
import globalStyles from "../styles/global";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDailyOutfit } from "../components/homescreen/outfits/useDailyOutfit";
import OutfitCard from "../components/homescreen/outfits/DailyOutfitCard";
import LoadingSkeleton from "../components/homescreen/outfits/LoadingSkeleton";
import * as Calendar from "expo-calendar";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { weather, error: weatherError, city, coordinates } = useWeather();
  const [calendarPermission, setCalendarPermission] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState([]);

  // Daily outfit hook
  const { dailyOutfit, loading, generating, initialising, generateOutfit } =
    useDailyOutfit(coordinates?.lat, coordinates?.lon, todaysEvents);

  useEffect(() => {
    requestCalendarPermissions();
  }, []);

  const requestCalendarPermissions = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === "granted") {
        setCalendarPermission(true);
        fetchTodaysEvents();
      } else {
        setCalendarPermission(false);
      }
    } catch (err) {}
  };

  const fetchTodaysEvents = async () => {
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );

      // Check if we have any calendars (Android issue)
      if (calendars.length === 0) {
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
    } catch (err) {}
  };

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: "#F6F7FB", flex: 1, paddingHorizontal: 0 },
      ]}
      edges={["top", "left", "right"]}
    >
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text
          style={[
            typography.title,
            {
              fontSize: 28,
              fontWeight: "800",
              marginBottom: 18,
              color: "#181A20",
            },
          ]}
        >
          👋 Hi {user?.backend?.name || "there"}!
        </Text>
      </View>

      {/* Daily Outfit Section */}
      <View style={styles.ensembleCardWrapper}>
        {!dailyOutfit && (loading || generating || initialising) ? (
          <LoadingSkeleton text="Styling your look…" />
        ) : dailyOutfit ? (
          <OutfitCard
            imageUrl={
              dailyOutfit.composite_image_url ||
              dailyOutfit.outfit?.composite_image_url
            }
            imageId={dailyOutfit.outfit_id || dailyOutfit.id}
            title={
              dailyOutfit.title ||
              dailyOutfit.outfit?.title ||
              "Today's Perfect Look"
            }
            explanation={
              dailyOutfit.explanation || dailyOutfit.outfit?.explanation
            }
            onNewLook={generateOutfit}
            loading={generating}
            events={todaysEvents}
            tags={dailyOutfit.tags || dailyOutfit.outfit?.tags || []}
            outfitData={dailyOutfit}
            modern
          />
        ) : null}
      </View>

      {weatherError && (
        <Text
          style={[
            typography.meta,
            { marginTop: 8, color: "#E57373", textAlign: "center" },
          ]}
        >
          ⚠️ {weatherError}
        </Text>
      )}

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
  ensembleCardWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
