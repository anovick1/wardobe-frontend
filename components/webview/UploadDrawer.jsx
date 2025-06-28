import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const DRAWER_HEIGHT = 180;

const UploadDrawer = ({
  visible,
  onClose,
  onCloseComplete,
  processedUploads,
  onRemoveUpload,
  onUploadAll,
  isUploading,
  safeBottom,
  barHeight = 64,
}) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(heightAnim, {
        toValue: DRAWER_HEIGHT,
        duration: 260,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
          if (onCloseComplete) onCloseComplete();
        }
      });
    }
  }, [visible]);

  if (!shouldRender || processedUploads.length === 0) return null;
  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.drawer,
        {
          height: heightAnim,
          overflow: "hidden",
          bottom: barHeight + safeBottom,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
      ]}
    >
      <View style={styles.handleRow}>
        <TouchableOpacity onPress={onClose} style={styles.handleButton}>
          <Icon name="expand-more" size={28} color="#bbb" />
        </TouchableOpacity>
      </View>
      <View style={[styles.headerRow, { marginBottom: 4 }]}>
        <Text style={styles.title}>Processed Items</Text>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            isUploading && styles.uploadButtonDisabled,
          ]}
          onPress={onUploadAll}
          disabled={isUploading || processedUploads.length === 0}
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
        contentContainerStyle={[styles.scrollContent, { marginBottom: 8 }]}
      >
        {processedUploads.map((upload, index) => (
          <Animated.View 
            key={upload.id} 
            style={[
              styles.uploadItemContainer,
              {
                opacity: upload.animatedValue || 1,
                transform: [{
                  scale: upload.animatedValue || 1
                }]
              }
            ]}
          >
            <View style={styles.uploadItem}>
              <Image
                source={{ uri: upload.croppedUri }}
                style={styles.uploadImage}
              />
              {upload.status === "processing" && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              {upload.status === "completed" && (
                <View style={styles.statusIndicator}>
                  <Text style={styles.statusText}>✓</Text>
                </View>
              )}
              {upload.status === "failed" && (
                <View style={styles.statusIndicatorFailed}>
                  <Icon 
                    name={upload.isClothingError ? "checkroom" : "close"} 
                    size={12} 
                    color="#fff" 
                  />
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
            {upload.status === "failed" && upload.errorMessage && (
              <View style={styles.errorTooltip}>
                <Text style={styles.errorTooltipText} numberOfLines={2}>
                  {upload.errorMessage}
                </Text>
              </View>
            )}
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 200,
    minHeight: 0,
    maxHeight: DRAWER_HEIGHT,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2,
  },
  // handleButton: {
  //   borderRadius: 0,
  //   padding: 0,
  // },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: "center",
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    fontWeight: "bold",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadNumber: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  uploadNumberText: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "bold",
  },
  errorTooltip: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    backgroundColor: "#ef4444",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 72,
  },
  errorTooltipText: {
    color: "#fff",
    fontSize: 9,
    textAlign: "center",
  },
});

export default UploadDrawer;
