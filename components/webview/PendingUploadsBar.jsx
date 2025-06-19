import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Shadow } from "react-native-shadow-2";

const PendingUploadsBar = ({
  pendingUploads,
  onRemoveUpload,
  onUploadAll,
  isUploading,
  uploadCount,
}) => {
  if (pendingUploads.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Processed Images</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{pendingUploads.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            isUploading && styles.uploadButtonDisabled,
          ]}
          onPress={onUploadAll}
          disabled={isUploading || pendingUploads.length === 0}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload All</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pendingUploads.map((upload, index) => (
          <View key={upload.id} style={styles.uploadItemContainer}>
            <View style={styles.uploadItem}>
              <Image
                source={{ uri: upload.croppedUri }}
                style={styles.uploadImage}
              />

              {/* Loading overlay for processing status */}
              {upload.status === "processing" && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}

              {/* Status indicator */}
              {upload.status === "completed" && (
                <View style={styles.statusIndicator}>
                  <Text style={styles.statusText}>✓</Text>
                </View>
              )}

              {upload.status === "failed" && (
                <View style={styles.statusIndicatorFailed}>
                  <Text style={styles.statusText}>✗</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveUpload(upload.id)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
              <View style={styles.uploadNumber}>
                <Text style={styles.uploadNumberText}>{index + 1}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 14,
    paddingBottom: 24,
    zIndex: 100,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  countBadge: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  uploadItemContainer: {
    marginRight: 8,
  },
  uploadItem: {
    width: 72,
    height: 72,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  uploadImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    backgroundColor: "#10b981",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIndicatorFailed: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  uploadNumber: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 2,
    alignItems: "center",
  },
  uploadNumberText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default PendingUploadsBar;
