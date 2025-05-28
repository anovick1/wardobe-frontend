// HomeScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import api from "../api";
import globalStyles from "../styles/global";
import typography from "../styles/typography";
import cardStyles from "../styles/card";

export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/items")
      .then((res) => {
        setItems(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching items:", err);
        setLoading(false);
      });
  }, []);

  const renderItem = ({ item }) => (
    <View style={cardStyles.card}>
      <Text style={typography.name}>{item.name}</Text>
      <Text style={typography.category}>{item.category}</Text>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={typography.title}>👕 Your Wardrobe</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#666" />
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
