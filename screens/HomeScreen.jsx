import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { useWeather } from "../contexts/WeatherContext";
import typography from "../styles/typography";
import globalStyles from "../styles/global";
import { SafeAreaView } from "react-native-safe-area-context";
import DailyOutfitGenerator from "../components/homescreen/outfits/DailyOutfitGenerator";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { weather, error: weatherError, city } = useWeather();

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

      <DailyOutfitGenerator />

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
});
