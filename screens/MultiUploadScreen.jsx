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
  const { images } = route.params;
  const { addItemToWardrobe } = useWardrobe();
  const [uploadStatus, setUploadStatus] = useState(
    images.map((_, index) => ({
      id: index,
      client_upload_id: `${Date.now()}-${index}`, // Unique ID for this upload
      status: "uploading",
      item: null,
      error: null,
    }))
  );

  // Upload and process each image
  useEffect(() => {
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
  }, [images]);

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
    // Add all completed items to the wardrobe
    uploadStatus.forEach((status) => {
      if (status.status === "completed" || status.status === "saved") {
        addItemToWardrobe(status.item);
      }
    });

    // Navigate back to wardrobe
    navigation.navigate("WardrobeHome");
  };

  const renderItem = ({ item, index }) => {
    const status = uploadStatus[index];
    const image = images[index];

    const showCleaned =
      status.status === "completed" || status.status === "saved";
    const imageUrl = showCleaned ? status.item.image_url : image.uri;

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
