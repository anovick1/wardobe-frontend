import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import api from "../api";
import typography from "../styles/typography";
import CachedImage from "../components/common/CachedImage";
import * as FileSystem from "expo-file-system";

export default function MultiUploadScreen({ route, navigation }) {
  const { images } = route.params;
  const [uploadStatus, setUploadStatus] = useState(
    images.map((_, index) => ({
      id: index,
      status: "pending", // pending, uploading, completed, error, saved
      item: null,
      error: null,
    }))
  );

  const uploadImage = async (uri, index) => {
    try {
      setUploadStatus((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, status: "uploading" } : item
        )
      );

      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");

      const filename = uri.split("/").pop();
      const ext = filename.split(".").pop();
      const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;

      const formData = new FormData();
      formData.append("file", { uri, name: filename, type: mime });

      const { data } = await api.post(
        "/wardrobe_items/upload_and_process",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      // Immediately cache the cleaned image
      const cleanedUrl = data.presigned_urls.cleaned;
      const itemId = data.item_id;
      const cachePath = `${FileSystem.cacheDirectory}wardrobe-${itemId}.jpg`;
      try {
        await FileSystem.downloadAsync(cleanedUrl, cachePath);
      } catch (e) {
        // Optionally handle error
      }

      setUploadStatus((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, status: "completed", item: data } : item
        )
      );
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, status: "error", error: error.message }
            : item
        )
      );
    }
  };

  useEffect(() => {
    const uploadImages = async () => {
      // Upload 2 images at a time
      for (let i = 0; i < images.length; i += 2) {
        const batch = images.slice(i, i + 2);
        await Promise.all(
          batch.map((image, batchIndex) =>
            uploadImage(image.uri, i + batchIndex)
          )
        );
      }
    };

    uploadImages();
  }, []);

  const handleEditItem = (item, index) => {
    navigation.navigate("ItemReview", {
      item,
      onSave: () => {
        setUploadStatus((prev) =>
          prev.map((status, i) =>
            i === index ? { ...status, status: "saved" } : status
          )
        );
      },
    });
  };

  const handleConfirmAll = () => {
    navigation.navigate("WardrobeHome");
  };

  const renderItem = ({ item, index }) => {
    const status = uploadStatus[index];
    const image = images[index];

    // Decide which image to show: original (pending/uploading) or cleaned (completed/saved)
    const showCleaned =
      status.status === "completed" || status.status === "saved";
    const imageUrl = showCleaned
      ? status.item.presigned_urls.cleaned
      : image.uri;
    const itemId = showCleaned ? status.item.item_id : `upload-${index}`;

    return (
      <View style={styles.itemContainer}>
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
        <View style={styles.statusContainer}>
          {status.status === "pending" && (
            <Text style={styles.statusText}>Waiting...</Text>
          )}
          {status.status === "uploading" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.statusText}>Uploading...</Text>
            </View>
          )}
          {status.status === "completed" && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditItem(status.item, index)}
            >
              <Text style={styles.editButtonText}>Edit Item</Text>
            </TouchableOpacity>
          )}
          {status.status === "saved" && (
            <View style={styles.savedContainer}>
              <Text style={[styles.statusText, styles.savedText]}>✓ Saved</Text>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonSecondary]}
                onPress={() => handleEditItem(status.item, index)}
              >
                <Text
                  style={[
                    styles.editButtonText,
                    styles.editButtonTextSecondary,
                  ]}
                >
                  Edit Again
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {status.status === "error" && (
            <Text style={[styles.statusText, styles.errorText]}>
              Error: {status.error}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const allUploaded = uploadStatus.every(
    (status) =>
      status.status === "completed" ||
      status.status === "saved" ||
      status.status === "error"
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={typography.title}>Uploading Wardrobe Items</Text>
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.list}
        />
        {allUploaded && (
          <View style={styles.confirmContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmAll}
            >
              <Text style={styles.confirmButtonText}>
                Confirm All & Return to Wardrobe
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  itemContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbnail: {
    width: 100,
    height: 100,
  },
  statusContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#dc2626",
  },
  savedContainer: {
    gap: 8,
  },
  savedText: {
    color: "#059669",
    fontWeight: "500",
  },
  editButton: {
    backgroundColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  editButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  editButtonTextSecondary: {
    color: "#000",
  },
  confirmContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  confirmButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
