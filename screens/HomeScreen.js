import React, { useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    if (!user?.firebase?.uid) {
      console.log("⛔ No user UID");
      return;
    }

    console.log("🟡 Starting wardrobe fetch...");

    const fetchItems = async () => {
      try {
        const res = await api.get("/wardrobe_items", {
          params: { user_id: user.firebase.uid },
        });
        console.log("📦 Got wardrobe items:", res.data.length);

        const itemsWithUrls = await Promise.all(
          res.data.map(async (item) => {
            console.log("🧥 Item:", item.id);

            if (!item.original_image || item.original_image.includes("http")) {
              console.log("✅ No need to sign:", item.original_image);
              return item;
            }

            try {
              console.log("🔐 Signing image:", item.original_image);
              const signedRes = await api.get("/images/get-url", {
                params: { key: item.original_image },
              });
              console.log("✅ Signed URL:", signedRes.data.url);
              return { ...item, signed_url: signedRes.data.url };
            } catch (err) {
              console.error(
                "❌ Error signing:",
                item.original_image,
                err.message
              );
              return item;
            }
          })
        );

        setItems(itemsWithUrls);
        console.log("✅ setItems complete");
      } catch (err) {
        console.error("❌ Full fetch error:", err.message);
      } finally {
        console.log("🧯 setLoading false");
        setLoading(false);
      }
    };

    fetchItems();
  }, [user]);

  const renderItem = ({ item }) => (
    <View style={cardStyles.card}>
      {item.signed_url ? (
        <Image
          source={{ uri: item.signed_url }}
          style={styles.image}
          resizeMode="cover"
          onError={() =>
            console.warn("⚠️ Failed to load image:", item.signed_url)
          }
        />
      ) : null}
      <Text style={typography.name}>
        {item.description || "No description"}
      </Text>
      <Text style={typography.category}>
        {item.primary_color || "Unknown Color"} – {item.size || "No size"}
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
        👋 Hi {user?.backend?.name || user?.backend?.email || "there"}!
      </Text>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          size="large"
          color="#666"
        />
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
});
