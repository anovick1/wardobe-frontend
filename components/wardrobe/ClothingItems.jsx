import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthContext } from "../../auth/AuthContext";
import api from "../../api";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";
import globalStyles from "../../styles/global";

export default function ClothingItems() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* fetch wardrobe */
  const loadItems = useCallback(async () => {
    if (!user?.firebase?.uid) return;
    try {
      const { data } = await api.get("/wardrobe_items", {
        params: { firebase_uid: user.firebase.uid },
      });
      setItems(data.map((i) => ({ ...i, image_url: i.image_url || null })));
    } catch (err) {
      console.error("Wardrobe fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.firebase?.uid]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  /* render */
  const renderItem = ({ item }) => (
    <View style={cardStyles.card}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.image} />
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
      <Text style={typography.title}>
        👋 Hi {user?.backend?.name || "there"}!
      </Text>

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
  image: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
});
