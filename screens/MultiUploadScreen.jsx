import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, onSnapshot, doc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../api";
import typography from "../styles/typography";
import * as FileSystem from "expo-file-system";
import { useWardrobe } from "../contexts/WardrobeContext";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // 2 columns with padding

export default function MultiUploadScreen({ route, navigation }) {
  const {
    images: initialImages,
    clientUploadIds,
    processedItems,
    skipUpload,
  } = route.params;
  const { addItemToWardrobe } = useWardrobe();
  const [images, setImages] = useState(initialImages);
  const [uploadStatus, setUploadStatus] = useState(
    initialImages.map((_, index) => ({
      id: index,
      client_upload_id: clientUploadIds
        ? clientUploadIds[index]
        : `${Date.now()}-${index}`,
      status:
        skipUpload && processedItems
          ? "completed"
          : clientUploadIds
          ? "processing"
          : "uploading",
      item: skipUpload && processedItems ? processedItems[index] : null,
      error: null,
    }))
  );

  // Upload and process each image (only if clientUploadIds are not provided)
  useEffect(() => {
    if (clientUploadIds) {
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
  }, [uploadStatus]);

  const handleAddMorePhotos = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant photo library access to add more photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 10 - images.length, // Limit based on current count
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets;
        const startIndex = images.length;

        // Add new images
        setImages((prev) => [...prev, ...newImages]);

        // Add new upload statuses
        const newStatuses = newImages.map((_, index) => ({
          id: startIndex + index,
          client_upload_id: `${Date.now()}-${startIndex + index}`,
          status: "uploading",
          item: null,
          error: null,
        }));

        setUploadStatus((prev) => [...prev, ...newStatuses]);

        // Upload the new images
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Not signed in");

        const formData = new FormData();
        newImages.forEach((image, index) => {
          const filename = image.uri.split("/").pop();
          const ext = filename.split(".").pop();
          const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;

          formData.append("files", {
            uri: image.uri,
            name: filename,
            type: mime,
          });
        });

        newStatuses.forEach(({ client_upload_id }) => {
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

        // Update new statuses to processing
        setUploadStatus((prev) =>
          prev.map((status, index) =>
            index >= startIndex ? { ...status, status: "processing" } : status
          )
        );
      }
    } catch (error) {
      console.error("Error adding more photos:", error);
      Alert.alert("Error", "Failed to add more photos. Please try again.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera access to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImage = result.assets[0];
        const startIndex = images.length;

        setImages((prev) => [...prev, newImage]);

        const newStatus = {
          id: startIndex,
          client_upload_id: `${Date.now()}-${startIndex}`,
          status: "uploading",
          item: null,
          error: null,
        };

        setUploadStatus((prev) => [...prev, newStatus]);

        // Upload the new image
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Not signed in");

        const formData = new FormData();
        const filename = newImage.uri.split("/").pop();
        const ext = filename.split(".").pop();
        const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;

        formData.append("files", {
          uri: newImage.uri,
          name: filename,
          type: mime,
        });
        formData.append("client_upload_ids", newStatus.client_upload_id);

        await api.post("/wardrobe_items/upload_and_process", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${idToken}`,
          },
        });

        setUploadStatus((prev) =>
          prev.map((status, index) =>
            index === startIndex ? { ...status, status: "processing" } : status
          )
        );
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleEditItem = (item, index) => {
    navigation.navigate("ItemReview", {
      item,
      fromBulkUpload: true,
      onSave: (updatedItem) => {
        setUploadStatus((prev) => {
          const updated = prev.map((status, i) =>
            i === index
              ? { ...status, status: "confirmed", item: updatedItem || item }
              : status
          );

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

  const handleRemoveItem = (index) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from the upload?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setImages((prev) => prev.filter((_, i) => i !== index));
            setUploadStatus((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleConfirmAll = async () => {
    const itemsToAdd = uploadStatus.filter(
      (status) =>
        (status.status === "completed" || status.status === "saved") &&
        status.item &&
        status.status !== "confirmed"
    );

    itemsToAdd.forEach((status) => {
      addItemToWardrobe(status.item);
    });

    if (itemsToAdd.length > 0) {
      try {
        const itemIds = itemsToAdd.map((status) => status.item.id);
        await api.post("/wardrobe_items/bulk_embed", {
          item_ids: itemIds,
        });
      } catch (err) {
        console.error("Bulk embed failed:", err);
      }
    }

    setUploadStatus((prev) => {
      const updated = prev.map((status) =>
        status.status !== "confirmed" && status.item
          ? { ...status, status: "confirmed" }
          : status
      );

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <ActivityIndicator size="small" color="#007AFF" />;
      case "completed":
        return <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />;
      case "confirmed":
        return <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />;
      case "error":
        return <Ionicons name="close-circle" size={20} color="#F44336" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing...";
      case "completed":
        return "Ready to review";
      case "confirmed":
        return "Added to wardrobe";
      case "error":
        return "Upload failed";
      default:
        return "";
    }
  };

  const renderItem = (status, index) => {
    const image = images[index];
    const showCleaned =
      status.status === "completed" || status.status === "saved";

    let imageUrl = image.uri;
    if (showCleaned && status.item && status.item.image_url) {
      const cachedPath = `${FileSystem.cacheDirectory}wardrobe-${status.item.id}.jpg`;
      try {
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
      <View key={index} style={styles.itemCard}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />

          {/* Status overlay */}
          <View style={styles.statusOverlay}>
            {getStatusIcon(status.status)}
          </View>

          {/* Remove button */}
          {(status.status === "uploading" || status.status === "error") && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(index)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.statusText}>{getStatusText(status.status)}</Text>
          {status.error && (
            <Text style={styles.errorText} numberOfLines={2}>
              {status.error}
            </Text>
          )}

          {status.status === "completed" && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditItem(status.item, index)}
            >
              <Text style={styles.editButtonText}>Review Item</Text>
            </TouchableOpacity>
          )}

          {status.status === "saved" && (
            <TouchableOpacity
              style={[styles.editButton, styles.editButtonSecondary]}
              onPress={() => handleEditItem(status.item, index)}
            >
              <Text
                style={[styles.editButtonText, styles.editButtonTextSecondary]}
              >
                Edit Details
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const anyUnconfirmed = uploadStatus.some(
    (s) => s.status !== "confirmed" && s.status !== "error"
  );

  const completedCount = uploadStatus.filter(
    (s) =>
      s.status === "completed" ||
      s.status === "confirmed" ||
      s.status === "saved"
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Upload Progress</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount} of {uploadStatus.length} items processed
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Items Grid */}
        <View style={styles.itemsGrid}>
          {uploadStatus.map((status, index) => renderItem(status, index))}

          {/* Add More Photos Card */}
          {images.length < 10 && (
            <View style={styles.addMoreContainer}>
              <TouchableOpacity
                style={styles.addMoreCard}
                onPress={handleAddMorePhotos}
              >
                <Ionicons name="images-outline" size={32} color="#007AFF" />
                <Text style={styles.addMoreText}>Add Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addMoreCard}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={32} color="#007AFF" />
                <Text style={styles.addMoreText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {anyUnconfirmed && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmAll}
          >
            <Text style={styles.confirmButtonText}>
              Add All to Wardrobe ({completedCount})
            </Text>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: cardWidth,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  statusOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 4,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    padding: 4,
  },
  itemInfo: {
    padding: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#F44336",
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  editButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  editButtonTextSecondary: {
    color: "#007AFF",
  },
  addMoreContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  addMoreCard: {
    width: cardWidth,
    aspectRatio: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
    paddingBottom: 32,
  },
  confirmButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
