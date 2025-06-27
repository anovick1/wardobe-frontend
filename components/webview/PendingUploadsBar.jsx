import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Pressable,
} from "react-native";
import { Shadow } from "react-native-shadow-2";
import Icon from "react-native-vector-icons/MaterialIcons";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 64;
const EXPANDED_HEIGHT = Math.min(360, SCREEN_HEIGHT * 0.6);

const PendingUploadsBar = ({
  pendingUploads,
  onRemoveUpload,
  onUploadAll,
  isUploading,
  uploadCount,
  expanded,
  setExpanded,
  navBarHeight = 56,
  collapsedHeight = 64,
  expandedHeight = 300,
  safeBottom = 0,
}) => {
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  // Drag to expand/collapse
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only vertical drags
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Optionally, you could animate height here for live feedback
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30) setExpanded(true); // swipe up
        else if (gestureState.dy > 30) setExpanded(false); // swipe down
      },
    })
  ).current;

  if (pendingUploads.length === 0) return null;

  // Interpolate height
  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedHeight, expandedHeight],
  });

  // Interpolate bottom position
  const bottom = expanded ? 0 : navBarHeight + safeBottom;

  // Overlay when expanded
  const overlay = expanded ? (
    <Pressable style={styles.overlay} onPress={() => setExpanded(false)} />
  ) : null;

  return (
    <>
      {overlay}
      <Animated.View
        style={[
          styles.container,
          { height, bottom, paddingBottom: expanded ? safeBottom : 0 },
        ]}
        pointerEvents="box-none"
      >
        {/* Handle */}
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <TouchableOpacity
            style={styles.handleBar}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <Icon
              name={expanded ? "expand-more" : "expand-less"}
              size={28}
              color="#bbb"
            />
          </TouchableOpacity>
        </View>

        {/* Header (always visible) */}
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

        {/* Collapsed: show summary only */}
        {!expanded && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {pendingUploads.slice(0, 1).map((upload, index) => (
              <View key={upload.id} style={styles.uploadItemContainer}>
                <View style={styles.uploadItem}>
                  <Image
                    source={{ uri: upload.croppedUri }}
                    style={styles.uploadImage}
                  />
                  {/* Status indicator */}
                  {upload.status === "completed" && (
                    <View style={styles.statusIndicator}>
                      <Text style={styles.statusText}>✓</Text>
                    </View>
                  )}
                  {upload.status === "processing" && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                  {upload.status === "failed" && (
                    <View style={styles.statusIndicatorFailed}>
                      <Text style={styles.statusText}>✗</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {pendingUploads.length > 1 && (
              <View style={styles.moreIndicator}>
                <Text style={styles.moreText}>
                  +{pendingUploads.length - 1} more
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Expanded: show all images and remove buttons */}
        {expanded && (
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
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
    zIndex: 99,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 2,
  },
  handleBar: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
  moreIndicator: {
    padding: 8,
    alignItems: "center",
  },
  moreText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default PendingUploadsBar;
