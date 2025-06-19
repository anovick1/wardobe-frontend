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
import { getFirestore, collection, onSnapshot, doc } from "firebase/firestore";
import api from "../api";
import typography from "../styles/typography";
import * as FileSystem from "expo-file-system";
import { useWardrobe } from "../contexts/WardrobeContext";

export default function MultiUploadScreen({ route, navigation }) {
  const { images, clientUploadIds, processedItems, skipUpload } = route.params;
  const { addItemToWardrobe } = useWardrobe();
  const [uploadStatus, setUploadStatus] = useState(
    images.map((_, index) => ({
      id: index,
      client_upload_id: clientUploadIds
        ? clientUploadIds[index]
        : `${Date.now()}-${index}`, // Use provided IDs or generate new ones
      status:
        skipUpload && processedItems
          ? "completed"
          : clientUploadIds
          ? "processing"
          : "uploading", // Set as completed if already processed
      item: skipUpload && processedItems ? processedItems[index] : null, // Use processed items if provided
      error: null,
    }))
  );

  // Upload and process each image (only if clientUploadIds are not provided)
  useEffect(() => {
    if (clientUploadIds) {
      // If client upload IDs are provided, skip the upload step
      console.log("✅ Using provided client upload IDs, skipping upload step");
      return;
    }

    const uploadImages = async () => {
      try {
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Not signed in");

        const formData = new FormData();

        images.forEach((image, index) => {
          const filename = image.uri.split("/").pop();
          const ext = filename.split(".").pop();
          const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;

          formData.append("files", {
            uri: image.uri,
            name: filename,
            type: mime,
          });
        });

        // Add client_upload_ids after files
        uploadStatus.forEach(({ client_upload_id }) => {
          formData.append("client_upload_ids", client_upload_id);
        });

        const res = await api.post(
          "/wardrobe_items/upload_and_process",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        console.log("✅ Upload started:", res.data);

        // Update all statuses to "processing"
        setUploadStatus((prev) =>
          prev.map((status) => ({ ...status, status: "processing" }))
        );
      } catch (err) {
        console.error("❌ Bulk upload failed:", err.message);
        setUploadStatus((prev) =>
          prev.map((s) => ({
            ...s,
            status: "error",
            error: err.message,
          }))
        );
      }
    };

    uploadImages();
  }, [images, clientUploadIds]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onSnapshot(
      collection(
        getFirestore(),
        "wardrobe_webhooks",
        auth.currentUser.uid,
        "completed_uploads"
      ),
      async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const matchIndex = uploadStatus.findIndex(
              (s) => s.client_upload_id === data.client_upload_id
            );
            if (matchIndex === -1) return;

            // Only cache the image after we get the processed item
            if (data.image_url) {
              const cachePath = `${FileSystem.cacheDirectory}wardrobe-${data.id}.jpg`;
              try {
                await FileSystem.downloadAsync(data.image_url, cachePath);
              } catch (e) {
                console.error("Failed to cache image:", e);
              }
            }

            setUploadStatus((prev) =>
              prev.map((item, i) =>
                i === matchIndex
                  ? { ...item, status: "completed", item: data }
                  : item
              )
            );
          }
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const handleEditItem = (item, index) => {
    navigation.navigate("ItemReview", {
      item,
      fromBulkUpload: true,
      onSave: () => {
        setUploadStatus((prev) => {
          const updated = prev.map((status, i) =>
            i === index ? { ...status, status: "confirmed", item } : status
          );
          // Only auto-navigate if ALL items are now confirmed (after this save)
          const allConfirmed = updated.every(
            (s) => s.status === "confirmed" || s.status === "error"
          );
          if (allConfirmed) {
            setTimeout(() => {
              navigation.navigate("WardrobeHome");
            }, 100);
          }
          return updated;
        });
      },
    });
  };

  const handleConfirmAll = async () => {
    // Only embed items that are not already confirmed
    const itemsToAdd = uploadStatus.filter(
      (status) =>
        (status.status === "completed" || status.status === "saved") &&
        status.item &&
        status.status !== "confirmed"
    );

    itemsToAdd.forEach((status) => {
      addItemToWardrobe(status.item);
    });

    // Call bulk embed API for all unconfirmed items
    if (itemsToAdd.length > 0) {
      try {
        const itemIds = itemsToAdd.map((status) => status.item.id);
        await api.post("/wardrobe_items/bulk_embed", {
          item_ids: itemIds,
        });
      } catch (err) {
        // Silent fail
      }
    }

    // Mark all embedded items as confirmed
    setUploadStatus((prev) => {
      const updated = prev.map((status) =>
        status.status !== "confirmed" && status.item
          ? { ...status, status: "confirmed" }
          : status
      );
      // If all are now confirmed, auto-navigate
      const allConfirmed = updated.every(
        (s) => s.status === "confirmed" || s.status === "error"
      );
      if (allConfirmed) {
        setTimeout(() => {
          navigation.navigate("WardrobeHome");
        }, 100);
      }
      return updated;
    });
  };

  const renderItem = ({ item, index }) => {
    const status = uploadStatus[index];
    const image = images[index];

    const showCleaned =
      status.status === "completed" || status.status === "saved";

    // Use cached image path if available, otherwise fall back to cleaned image URL or original
    let imageUrl = image.uri; // Default to passed image URI (which should be cached path)
    if (showCleaned && status.item && status.item.image_url) {
      // Try to use cached image first, fall back to cleaned image URL
      const cachedPath = `${FileSystem.cacheDirectory}wardrobe-${status.item.id}.jpg`;
      try {
        // Check if cached file exists
        if (FileSystem.getInfoAsync(cachedPath)) {
          imageUrl = cachedPath;
        } else {
          imageUrl = status.item.image_url;
        }
      } catch (e) {
        imageUrl = status.item.image_url;
      }
    }

    return (
      <View style={styles.itemContainer}>
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
        <View style={styles.statusContainer}>
          {status.status === "uploading" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.statusText}>Uploading...</Text>
            </View>
          )}
          {status.status === "processing" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.statusText}>Processing...</Text>
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

  // Only show Confirm All if there are unconfirmed items
  const anyUnconfirmed = uploadStatus.some(
    (s) => s.status !== "confirmed" && s.status !== "error"
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
        {anyUnconfirmed && (
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
