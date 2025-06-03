import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { AuthContext } from "../auth/AuthContext";
import { useWeather } from "../contexts/WeatherContext";
import api from "../api";
import cardStyles from "../styles/card";
import typography from "../styles/typography";
import globalStyles from "../styles/global";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const { weather, error: weatherError } = useWeather();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -----------------------------
   * Fetch wardrobe items + images
   * ----------------------------- */
  const loadItems = useCallback(async () => {
    if (!user?.firebase?.uid) return;

    try {
      const { data } = await api.get("/wardrobe_items", {
        params: { firebase_uid: user.firebase.uid },
      });

      const hydrated = await Promise.all(
        data.map(async (item) => {
          const key = item.cleaned_image_url || item.original_image_url;

          if (!key) return item;

          if (key.startsWith("http")) {
            return { ...item, image_url: key };
          }

          try {
            const {
              data: { url },
            } = await api.get("/images/get-url", { params: { key } });

            return { ...item, image_url: url };
          } catch (e) {
            console.error("❌ Failed to sign image:", key, e);
            return item;
          }
        })
      );

      setItems(hydrated);
    } catch (err) {
      console.error("Wardrobe fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.firebase?.uid]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  /* ---------- Render item card ---------- */
  const renderItem = ({ item }) => (
    <View style={cardStyles.card}>
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <Text style={typography.name}>{item.name ?? "Unnamed item"}</Text>
      {!!item.description && (
        <Text style={typography.description}>{item.description}</Text>
      )}
      <Text style={typography.category}>
        {item.primary_color ?? "Unknown color"} – {item.size ?? "No size"}
      </Text>
      <Text style={typography.meta}>
        Times worn: {item.times_worn} • Favorite:{" "}
        {item.is_favorite ? "Yes" : "No"}
      </Text>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={typography.title}>👋</Text>
      <Text style={typography.title}>
        Hi {user?.backend?.name || user?.backend?.email || "there"}!
      </Text>

      {weather && (
        <View style={styles.weatherCard}>
          <Text style={typography.meta}>
            Weather: {weather.temperature}°C – {weather.weather_description}
          </Text>
          <Text style={typography.meta}>
            Clothing Tip: {weather.clothing_hint}
          </Text>
        </View>
      )}

      {weatherError && (
        <Text style={[typography.meta, { marginTop: 8 }]}>
          ⚠️ {weatherError}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <Text style={[typography.meta, { marginTop: 30 }]}>
          No wardrobe items yet.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={globalStyles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  weatherCard: {
    marginVertical: 16,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
});
