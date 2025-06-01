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
    api
      .get("/wardrobe_items", {
        params: { user_id: user?.uid },
      })
      .then((res) => {
        setItems(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  const renderItem = ({ item }) => (
    <View style={cardStyles.card}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
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
        👋 Hi {user?.backend?.name + " " + user?.backend?.email || "there"}!
      </Text>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          size="large"
          color="#666"
        />
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
