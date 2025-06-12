import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Keyboard,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { auth } from "../firebase";
import api from "../api";

const AddLinkScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com");
  const [urlInput, setUrlInput] = useState("");
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const webViewRef = useRef(null);

  const handleSubmit = async () => {
    if (!currentUrl) {
      Alert.alert("Error", "Please navigate to a product page first.");
      return;
    }

    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();

      const response = await api.post(
        "/wardrobe_items/scrape_and_process",
        { url: currentUrl },
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
        },
      });
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

  const handleUrlSubmit = () => {
    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    setCurrentUrl(url);
    setUrlInput(url);
    Keyboard.dismiss();
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.urlContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="Enter URL"
            value={isUrlFocused ? urlInput : currentUrl}
            onChangeText={setUrlInput}
            onSubmitEditing={handleUrlSubmit}
            onFocus={() => {
              setIsUrlFocused(true);
              setUrlInput(currentUrl);
            }}
            onBlur={() => {
              setIsUrlFocused(false);
              setUrlInput(currentUrl);
            }}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="go"
          />
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => webViewRef.current?.reload()}
          >
            <Icon name="refresh" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        onNavigationStateChange={(navState) => {
          setCurrentUrl(navState.url);
          setUrlInput(navState.url);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Link</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  urlContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  urlInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#000",
  },
  refreshButton: {
    padding: 8,
  },
  webView: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default AddLinkScreen;
