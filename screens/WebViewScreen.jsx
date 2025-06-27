import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Keyboard,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { auth } from "../firebase";
import api from "../api";
import { useNavigation } from "@react-navigation/native";
import { Shadow } from "react-native-shadow-2";
import WebViewSection from "../components/webview/WebViewSection";
import EnhancedCropModal from "../components/common/EnhancedCropModal";
import PendingUploadsBar from "../components/webview/PendingUploadsBar";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/MaterialIcons";
import UploadDrawer from "../components/webview/UploadDrawer";

const NAV_BAR_HEIGHT = 56;
const PENDING_BAR_COLLAPSED_HEIGHT = 64;
const PENDING_BAR_EXPANDED_HEIGHT = 300; // match PendingUploadsBar expanded height

const WebViewScreen = ({}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("https://www.google.com");
  const [productUrl, setProductUrl] = useState(null);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const webViewRef = useRef(null);
  const viewShotRef = useRef(null);
  const [viewReady, setViewReady] = useState(false);
  const isMounted = useRef(true);

  // State for processed uploads
  const [processedUploads, setProcessedUploads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBarExpanded, setPendingBarExpanded] = useState(false);

  // WebView should always show warning when leaving (regardless of captures)
  const { showExitWarning } = useUnsavedChangesWarning(true);

  // Navigation state
  const [navigationState, setNavigationState] = useState({
    canGoBack: false,
    canGoForward: false,
  });

  // Calculate bottom padding for WebViewSection
  const webViewBottomPad = pendingBarExpanded
    ? PENDING_BAR_EXPANDED_HEIGHT + insets.bottom
    : NAV_BAR_HEIGHT + PENDING_BAR_COLLAPSED_HEIGHT + insets.bottom;

  const [showUploadDrawer, setShowUploadDrawer] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: "none" } });
    }

    // Listen for navigation events to restore tab bar
    const unsubscribeFocus = navigation.addListener("beforeRemove", () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined });
      }
    });

    return () => {
      unsubscribeFocus();
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [navigation]);

  const handleCaptureProduct = async () => {
    try {
      setLoading(true);
      const url = productUrl;
      const token = await auth.currentUser.getIdToken();
      const response = await api.post(
        "/wardrobe_items/extract_product_metadata",
        { url },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { item_id, status } = response.data;
      if (item_id && status === "processing") {
        setItemId(item_id);
        await handleScreenshot(item_id);
      } else {
        throw new Error("Failed to extract product metadata");
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.error || err.message || "Failed to add product.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async (item_id) => {
    if (!viewReady) {
      Alert.alert(
        "Error",
        "View is not ready yet. Please try again in a moment.",
      );
      return;
    }
    try {
      setProcessingImage(true);
      const uri = await viewShotRef.current.capture({
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });
      if (!uri)
        throw new Error("Failed to capture screenshot - no URI returned");
      setScreenshotUri(uri);
      setShowCropModal(true);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to capture screenshot. Please try again. Error: " + err.message,
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const handleCropComplete = async (croppedUri) => {
    setShowCropModal(false);

    // Add to processed uploads immediately with processing status
    const newProcessedUpload = {
      id: Date.now() + Math.random(),
      originalUri: croppedUri,
      croppedUri: croppedUri,
      cleanedImageUrl: null,
      itemId: itemId,
      status: "processing",
    };
    setProcessedUploads((prev) => [...prev, newProcessedUpload]);
    setShowUploadDrawer(true); // Auto-open drawer after upload

    await processProductImage(croppedUri, itemId);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setScreenshotUri(null);
  };

  const processProductImage = async (imageUri, item_id) => {
    try {
      setIsProcessing(true);
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", {
        uri:
          Platform.OS === "android"
            ? imageUri
            : imageUri.replace("file://", ""),
        type: "image/jpeg",
        name: "product_image.jpg",
      });
      const imageResponse = await api.post(
        `/wardrobe_items/${item_id}/process_product_image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Check for different possible field names for the cleaned image URL
      const cleanedImageUrl =
        imageResponse.data.urls?.cleaned ||
        imageResponse.data.cleaned ||
        imageResponse.data.image_url ||
        imageResponse.data.url ||
        imageResponse.data.cleaned_url;

      // Only cache if we have a valid cleaned image URL
      if (cleanedImageUrl) {
        // Cache the cleaned image
        const cachePath = `${FileSystem.cacheDirectory}wardrobe-${item_id}.jpg`;
        try {
          await FileSystem.downloadAsync(cleanedImageUrl, cachePath);
        } catch (e) {
          console.error("Failed to cache cleaned image:", e);
        }

        // Update the existing upload with cleaned image URL and cached path
        setProcessedUploads((prev) =>
          prev.map((upload) =>
            upload.itemId === item_id
              ? { ...upload, cleanedImageUrl, cachedImagePath: cachePath }
              : upload,
          ),
        );
      } else {
        console.warn("⚠️ No cleaned in response:", imageResponse.data);
        // Update the existing upload without cleaned image URL
        setProcessedUploads((prev) =>
          prev.map((upload) =>
            upload.itemId === item_id
              ? { ...upload, status: "failed" }
              : upload,
          ),
        );
      }

      // Poll for status
      const checkStatus = async () => {
        const itemResponse = await api.get(
          `/wardrobe_items/${item_id}/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        return itemResponse.data;
      };

      // Poll every 500ms until complete or failed
      const pollStatus = async () => {
        const status = await checkStatus();
        if (status.status === "completed") {
          // Update the processed upload status
          setProcessedUploads((prev) =>
            prev.map((upload) =>
              upload.itemId === item_id
                ? { ...upload, status: "completed", item: status }
                : upload,
            ),
          );
          // Don't navigate - stay on web page
        } else if (status.status === "failed") {
          // Update the processed upload status
          setProcessedUploads((prev) =>
            prev.map((upload) =>
              upload.itemId === item_id
                ? { ...upload, status: "failed", item: status }
                : upload,
            ),
          );
          // Don't navigate - stay on web page
        } else {
          // Still processing, wait and try again
          setTimeout(pollStatus, 500);
        }
      };

      // Start polling
      pollStatus();
    } catch (err) {
      console.error("Image processing failed:", err);

      // Update the existing upload to failed status
      setProcessedUploads((prev) =>
        prev.map((upload) =>
          upload.itemId === item_id ? { ...upload, status: "failed" } : upload,
        ),
      );

      Alert.alert("Error", "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete all processed uploads from backend and clear state
  const deleteAllProcessedUploads = async () => {
    try {
      await Promise.all(
        processedUploads.map(async (upload) => {
          if (upload.itemId) {
            try {
              await api.delete(`/wardrobe_items/${upload.itemId}`);
            } catch (err) {
              // Ignore individual errors, log for debugging
              console.error("Failed to delete item", upload.itemId, err);
            }
          }
        }),
      );
    } catch (err) {
      // Ignore
    }
    setProcessedUploads([]);
  };

  // Remove a single processed upload and delete from backend, with confirmation
  const removeProcessedUpload = (uploadId) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this processed image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const upload = processedUploads.find((u) => u.id === uploadId);
            if (upload && upload.itemId) {
              try {
                await api.delete(`/wardrobe_items/${upload.itemId}`);
              } catch (err) {
                console.error("Failed to delete item", upload.itemId, err);
              }
            }
            setProcessedUploads((prev) =>
              prev.filter((upload) => upload.id !== uploadId),
            );
          },
        },
      ],
    );
  };

  const handleUploadAll = () => {
    // Filter only completed uploads that have items AND valid itemIds
    const completedUploads = processedUploads.filter(
      (upload) =>
        upload.status === "completed" &&
        upload.item &&
        (upload.item.id || upload.item.item_id),
    );

    if (completedUploads.length === 0) {
      Alert.alert(
        "No Items Ready",
        "No items have finished processing yet. Please wait for the processing to complete.",
      );
      return;
    }

    // Navigate to MultiUploadScreen with the completed items
    navigation.navigate("MultiUpload", {
      images: completedUploads.map((upload) => ({
        uri: upload.cachedImagePath || upload.croppedUri,
      })),
      clientUploadIds: completedUploads.map((upload) => upload.id),
      processedItems: completedUploads.map((upload) => ({
        ...upload.item,
        id: upload.item.id || upload.item.item_id, // Normalize id field for addItemToWardrobe
        image_url: upload.item.presigned_urls?.cleaned || upload.item.image_url, // Normalize image_url field for wardrobe display
      })),
      skipUpload: true, // Add flag to indicate items are already processed
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.instructionText}>
          For best results, find a product photo with a clean background and no
          people or models in the image.
        </Text>
        <View style={styles.urlBarContainer}>
          <TouchableOpacity
            onPress={() =>
              showExitWarning(async () => {
                await deleteAllProcessedUploads();
                navigation.goBack();
              })
            }
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.urlInputWrapper}>
            <TextInput
              style={styles.urlInput}
              placeholder="Enter URL"
              value={urlInput}
              onChangeText={setUrlInput}
              onSubmitEditing={() => {
                let url = urlInput.trim();
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                  url = "https://" + url;
                }
                setUrlInput(url);
                setProductUrl(url);
                Keyboard.dismiss();
                webViewRef.current?.reload();
              }}
              onFocus={() => setIsUrlFocused(true)}
              onBlur={() => setIsUrlFocused(false)}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="go"
            />
          </View>
          <TouchableOpacity
            onPress={() => webViewRef.current?.reload()}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingBottom: 64 + insets.bottom }}>
        <WebViewSection
          viewShotRef={viewShotRef}
          webViewRef={webViewRef}
          urlInput={urlInput}
          setProductUrl={setProductUrl}
          isMounted={isMounted}
          setViewReady={setViewReady}
          onNavigationStateChange={(navState) => {
            setNavigationState(navState);
            // Only update urlInput if user is not actively typing in the URL bar
            // and if the URL change is significant (not just a search query change)
            if (!isUrlFocused && urlInput !== navState.url && navState.url) {
              // Don't update for search result URLs or query parameters
              const currentDomain = urlInput.split("?")[0].split("#")[0];
              const newDomain = navState.url.split("?")[0].split("#")[0];

              // Only update if the base domain changed, not just query parameters
              if (currentDomain !== newDomain) {
                setUrlInput(navState.url);
              }
            }
          }}
        />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}

      {/* Unified Bottom Bar */}
      {!loading && (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom,
              height: 64 + insets.bottom,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#fff",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
            },
          ]}
        >
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => webViewRef.current?.goBack()}
            disabled={!navigationState.canGoBack}
          >
            <Icon
              name="arrow-back-ios"
              size={28}
              color={navigationState.canGoBack ? "#007AFF" : "#ccc"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#007AFF",
              borderRadius: 24,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
            onPress={handleCaptureProduct}
            disabled={loading}
          >
            <Icon name="camera-alt" size={20} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
                marginLeft: 6,
              }}
            >
              Capture
            </Text>
          </TouchableOpacity>
          {/* Upload badge/button */}
          {processedUploads.length > 0 ? (
            <TouchableOpacity
              style={{ padding: 8, flexDirection: "row", alignItems: "center" }}
              onPress={() => setShowUploadDrawer((v) => !v)}
            >
              <Icon name="cloud-upload" size={24} color="#007AFF" />
              <Text
                style={{ color: "#007AFF", fontWeight: "bold", marginLeft: 4 }}
              >
                {processedUploads.length}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => webViewRef.current?.goForward()}
            disabled={!navigationState.canGoForward}
          >
            <Icon
              name="arrow-forward-ios"
              size={28}
              color={navigationState.canGoForward ? "#007AFF" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      )}

      <EnhancedCropModal
        visible={showCropModal}
        imageUri={screenshotUri}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        processingImage={processingImage}
      />

      {/* Upload Drawer */}
      {processedUploads.length > 0 && (
        <UploadDrawer
          visible={showUploadDrawer}
          onClose={() => setShowUploadDrawer(false)}
          onCloseComplete={() => setShowUploadDrawer(false)}
          processedUploads={processedUploads}
          onRemoveUpload={removeProcessedUpload}
          onUploadAll={handleUploadAll}
          isUploading={isProcessing}
          safeBottom={insets.bottom}
          barHeight={64}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  instructionText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  urlBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "400",
  },
  urlInputWrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urlInput: {
    fontSize: 16,
    color: "#000",
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 24,
    color: "#000",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  navButtonBottom: {
    padding: 6,
  },
  captureButtonBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  captureButtonWithCountBar: {
    backgroundColor: "#0056b3",
  },
  captureButtonTextBar: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  pendingCountBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  pendingCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "6%",
    alignItems: "center",
    zIndex: 150,
  },
  footerWithPending: {
    bottom: 140,
  },
  captureButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffffee",
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  pendingIndicator: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    paddingHorizontal: 6,
  },
  pendingIndicatorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default WebViewScreen;
