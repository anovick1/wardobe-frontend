import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWeather } from "../../../contexts/WeatherContext";
import useCachedImage from "../../../hooks/useCachedImage";

export default function OutfitCard({
  imageUrl,
  imageId,
  title,
  explanation,
  onNewLook,
  loading = false,
  events = [],
  tags = [],
  outfitData = null,
}) {
  const { weather, city } = useWeather();
  const navigation = useNavigation();
  const { uri: cachedUri } = useCachedImage(
    imageUrl,
    imageId || "daily-outfit"
  );

  const handleViewDetails = () => {
    // For daily outfits, the outfit ID is nested in outfitData.outfit.id
    const outfitId = outfitData?.outfit?.id;
    if (outfitId) {
      // Navigate directly to OutfitDetail in the Wardrobe stack
      navigation.navigate("Wardrobe", {
        screen: "WardrobeHome",
        params: { initialTab: "Outfits" },
      });
      navigation.navigate("Wardrobe", {
        screen: "OutfitDetail",
        params: { outfitId: outfitId, fromHome: true },
      });
    }
  };

  // Build a simple events summary (first 2 events)
  const eventSummary =
    events && events.length > 0
      ? events
          .slice(0, 2)
          .map(
            (e) =>
              `${e.title} @ ${new Date(e.startDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
          )
          .join("  •  ")
      : null;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Today's Ensemble</Text>
          <View style={styles.newLookButtonLoading}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        </View>
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherEmoji}>☀️</Text>
          <Text style={styles.weatherText}>
            {city || "Your location"} •{" "}
            {weather?.weather_description || "Clear"},{" "}
            {weather?.temperature || "22"}°{weather?.temperature ? "F" : "C"}
          </Text>
        </View>
        <View style={styles.outfitContainer}>
          <View style={styles.loadingImageContainer}>
            <ActivityIndicator size="large" color="#181A20" />
            <Text style={styles.loadingText}>Styling your look...</Text>
          </View>
          <View style={styles.outfitTextBlock}>
            <View style={styles.loadingTitleBar} />
            <View style={styles.loadingTagsContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.loadingTag} />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Today's Ensemble</Text>
        <TouchableOpacity
          style={styles.newLookButton}
          onPress={onNewLook}
          disabled={loading}
        >
          <Text style={styles.newLookButtonText}>New Look</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.weatherInfo}>
        <Text style={styles.weatherEmoji}>☀️</Text>
        <Text style={styles.weatherText}>
          {city || "Your location"} • {weather?.weather_description || "Clear"},{" "}
          {weather?.temperature || "22"}°{weather?.temperature ? "F" : "C"}
        </Text>
      </View>
      <View style={styles.outfitContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: cachedUri || imageUrl }}
            style={styles.outfitImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Generating outfit...</Text>
          </View>
        )}
        <View style={styles.outfitTextBlock}>
          <Text style={styles.outfitTitleHeader}>
            {title || "Perfect Daily Look"}
          </Text>
          {tags && tags.length > 0 && (
            <View style={styles.tagsContainerTop}>
              {tags.slice(0, 6).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.viewDetailsButtonBottom}
        onPress={handleViewDetails}
      >
        <Text style={styles.viewDetailsText}>
          View Details <Text style={styles.arrowIcon}>→</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 0,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#181A20",
    marginBottom: 12,
    textAlign: "left",
  },
  weatherInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  weatherEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  weatherText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  outfitContainer: {
    alignItems: "center",
  },
  outfitImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 18,
    backgroundColor: "#f3f4f6",
  },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "500",
  },
  outfitTextBlock: {
    alignSelf: "flex-start",
    marginLeft: 2,
    marginTop: 2,
  },
  outfitTitleHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: "#181A20",
    marginBottom: 12,
    textAlign: "left",
    marginLeft: 0,
  },
  outfitDescription: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 18,
    textAlign: "center",
  },
  wearButton: {
    backgroundColor: "#181A20",
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4,
  },
  wearButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  wearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  eventSummary: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 14,
    textAlign: "center",
  },
  tagsContainer: {
    display: "none",
  },
  tagChip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  viewDetailsButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  viewDetailsText: {
    color: "#181A20",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.02,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpinner: {
    marginRight: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  tagsContainerTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    marginLeft: 0,
    justifyContent: "flex-start",
  },
  fabButton: {
    position: "absolute",
    right: 18,
    bottom: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#181A20",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  fabButtonText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    marginTop: -2,
  },
  newLookButton: {
    backgroundColor: "#181A20",
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginLeft: "auto",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 0,
      },
      android: {
        elevation: 0,
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
    }),
    height: 30,
    minWidth: 80,
  },
  newLookButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.05,
  },
  viewDetailsButtonBottom: {
    position: "absolute",
    right: 22,
    bottom: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "transparent",
    elevation: 0,
    zIndex: 10,
  },
  arrowIcon: {
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 2,
  },
  // Loading state styles
  newLookButtonLoading: {
    backgroundColor: "#181A20",
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginLeft: "auto",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    minWidth: 80,
  },
  loadingImageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  loadingTitleBar: {
    width: "60%",
    height: 20,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 12,
  },
  loadingTagsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  loadingTag: {
    width: 60,
    height: 24,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
  },
});
