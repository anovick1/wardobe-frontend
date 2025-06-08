import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth } from "../firebase";
import api from "../api";

const AddLinkScreen = ({ navigation }) => {
  const [product_link, setProduct_link] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!product_link.trim()) {
      Alert.alert("Missing product_link", "Please paste a product URL.");
      return;
    }

    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();

      const response = await api.post(
        "/wardrobe_items/scrape_and_process",
        { url: product_link },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const item = response?.data;
      if (!item || !item.item_id || !item.image_urls?.cleaned) {
        throw new Error("Invalid item data returned from server");
      }

      // 🔍 Optional: Debug the image URLs
      console.log("✅ Scraped Item:", item);
      console.log("🖼️ Cleaned URL:", item.image_urls.cleaned);

      navigation.navigate("ItemReview", {
        item: {
          item_id: item.item_id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          primary_color: item.primary_color,
          description: item.description || item.name,
          product_link: item.product_link,
          tags: item.tags,
          gpt_metadata: {
            tags: item.tags,
            raw: item.name,
            brand: item.brand,
          },
          image_urls: item.image_urls,
        },
      });

      setProduct_link(""); // optional: clear field after success
    } catch (err) {
      console.error("❌ Scrape failed:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.error ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Paste Product Link</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com"
        value={product_link}
        onChangeText={setProduct_link}
        autoCapitalize="none"
        keyboardType="url"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <Button title="Submit Link" onPress={handleSubmit} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
});

export default AddLinkScreen;
