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
import api from "../api";
import cardStyles from "../styles/card";
import typography from "../styles/typography";
import globalStyles from "../styles/global";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------
   * Fetch wardrobe items + sign images
   * --------------------------------- */
  const loadItems = useCallback(async () => {
    if (!user?.firebase?.uid) return;

    try {
      const { data } = await api.get("/wardrobe_items", {
        params: { user_id: user.firebase.uid },
      });

      const hydrated = await Promise.all(
        data.map(async (item) => {
          // Already a full URL – no presign needed
          if (item.original_image?.startsWith("http")) {
            return { ...item, image_url: item.original_image };
          }

          // Otherwise ask backend for a presigned URL
          try {
            const {
              data: { url },
            } = await api.get("/images/get-url", {
              params: { key: item.original_image },
            });

            return { ...item, image_url: url };
          } catch {
            // If signing fails, just return the item as-is (image won’t show)
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

  /* ----------  Item card  ---------- */
  const renderItem = ({ item }) => (
    <View style={cardStyles.card}>
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <Text style={typography.name}>
        {item.description ?? "No description"}
      </Text>
      <Text style={typography.category}>
        {item.primary_color ?? "Unknown color"} – {item.size ?? "No size"}
      </Text>
      <Text style={typography.meta}>
        Times worn: {item.times_worn} • Favorite:{" "}
        {item.is_favorite ? "Yes" : "No"}
      </Text>
    </View>
  );

  /* ----------  UI  ---------- */
  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#666" />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={typography.title}>
        👋 Hi {user?.backend?.name || user?.backend?.email || "there"}!
      </Text>

      {items.length === 0 ? (
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
});
