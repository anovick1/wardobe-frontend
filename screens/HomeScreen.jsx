// screens/HomeScreen.jsx
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { AuthContext } from "../auth/AuthContext";
import api from "../api";
import cardStyles from "../styles/card";
import typography from "../styles/typography";
import globalStyles from "../styles/global";

export default function HomeScreen() {
  const { user } = useContext(AuthContext); // 👈  grab current user
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
        console.error(err);
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
      <Text style={typography.title}>
        👋 Hi {user?.displayName || user?.email || "there"}!
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

const styles = StyleSheet.create({});
