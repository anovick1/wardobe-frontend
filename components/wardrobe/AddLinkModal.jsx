import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { auth } from "../../firebase";
import api from "../../api";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";

export default function AddLinkModal({ visible, onClose, navigation }) {
  const [productLink, setProductLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!productLink.trim()) {
      alert("Please paste a product URL.");
      return;
    }
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();
      const response = await api.post(
        "/wardrobe_items/scrape_and_process",
        { url: productLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const item = response?.data;
      if (!item || !item.item_id || !item.image_urls?.cleaned) {
        throw new Error("Invalid item data returned from server");
      }
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
          presigned_urls: item.image_urls, // for compatibility
        },
      });
      setProductLink("");
      onClose();
    } catch (err) {
      alert(
        err?.response?.data?.error ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={cardStyles.modalSheetCentered}>
          <Text style={typography.title}>Paste Product Link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com"
            value={productLink}
            onChangeText={setProductLink}
            autoCapitalize="none"
            keyboardType="url"
            editable={!loading}
          />
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#000"
              style={{ marginVertical: 12 }}
            />
          ) : (
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Link</Text>
            </Pressable>
          )}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
    marginTop: 18,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    color: "#121416",
    width: 260,
    alignSelf: "center",
  },
  submitButton: {
    backgroundColor: "#121416",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: "#6a7681",
    fontSize: 15,
    fontWeight: "500",
  },
});
