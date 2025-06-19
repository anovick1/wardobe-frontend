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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebase";
import api from "../api";
import { useNavigation } from "@react-navigation/native";
import { Shadow } from "react-native-shadow-2";
import InstructionBanner from "../components/webview/InstructionBanner";
import UrlHeader from "../components/webview/UrlHeader";
import WebViewSection from "../components/webview/WebViewSection";
import EnhancedCropModal from "../components/common/EnhancedCropModal";
import PendingUploadsBar from "../components/webview/PendingUploadsBar";
import * as FileSystem from "expo-file-system";

const WebViewScreen = ({}) => {
  const navigation = useNavigation();
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

  // Navigation state
  const [navigationState, setNavigationState] = useState({
    canGoBack: false,
    canGoForward: false,
  });

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
    return () => {
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
        { headers: { Authorization: `Bearer ${token}` } }
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
        err?.response?.data?.error || err.message || "Failed to add product."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async (item_id) => {
    if (!viewReady) {
      Alert.alert(
        "Error",
        "View is not ready yet. Please try again in a moment."
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
        "Failed to capture screenshot. Please try again. Error: " + err.message
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
        }
      );

      console.log("✅ Image processing response:", imageResponse.data);

      // Check for different possible field names for the cleaned image URL
      const cleanedImageUrl =
        imageResponse.data.urls?.cleaned ||
        imageResponse.data.cleaned_image_url ||
        imageResponse.data.image_url ||
        imageResponse.data.url ||
        imageResponse.data.cleaned_url;

      console.log("🔍 Looking for cleaned image URL in response fields:", {
        urls: imageResponse.data.urls,
        cleaned_image_url: imageResponse.data.cleaned_image_url,
        image_url: imageResponse.data.image_url,
        url: imageResponse.data.url,
        cleaned_url: imageResponse.data.cleaned_url,
        allKeys: Object.keys(imageResponse.data),
      });

      // Only cache if we have a valid cleaned image URL
      if (cleanedImageUrl) {
        // Cache the cleaned image
        const cachePath = `${FileSystem.cacheDirectory}wardrobe-${item_id}.jpg`;
        try {
          await FileSystem.downloadAsync(cleanedImageUrl, cachePath);
          console.log("✅ Cached cleaned image:", cachePath);
        } catch (e) {
          console.error("Failed to cache cleaned image:", e);
        }

        // Update the existing upload with cleaned image URL and cached path
        setProcessedUploads((prev) =>
          prev.map((upload) =>
            upload.itemId === item_id
              ? { ...upload, cleanedImageUrl, cachedImagePath: cachePath }
              : upload
          )
        );
      } else {
        console.warn(
          "⚠️ No cleaned_image_url in response:",
          imageResponse.data
        );
        // Update the existing upload without cleaned image URL
        setProcessedUploads((prev) =>
          prev.map((upload) =>
            upload.itemId === item_id ? { ...upload, status: "failed" } : upload
          )
        );
      }

      // Poll for status
      const checkStatus = async () => {
        const itemResponse = await api.get(
          `/wardrobe_items/${item_id}/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
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
                : upload
            )
          );
          // Don't navigate - stay on web page
        } else if (status.status === "failed") {
          // Update the processed upload status
          setProcessedUploads((prev) =>
            prev.map((upload) =>
              upload.itemId === item_id
                ? { ...upload, status: "failed", item: status }
                : upload
            )
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
          upload.itemId === item_id ? { ...upload, status: "failed" } : upload
        )
      );

      Alert.alert("Error", "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeProcessedUpload = (uploadId) => {
    setProcessedUploads((prev) =>
      prev.filter((upload) => upload.id !== uploadId)
    );
  };

  const handleUploadAll = () => {
    // Filter only completed uploads that have items
    const completedUploads = processedUploads.filter(
      (upload) => upload.status === "completed" && upload.item
    );

    if (completedUploads.length === 0) {
      Alert.alert(
        "No Items Ready",
        "No items have finished processing yet. Please wait for the processing to complete."
      );
      return;
    }

    // Navigate to MultiUploadScreen with the completed items
    navigation.navigate("MultiUpload", {
      images: completedUploads.map((upload) => ({
        uri: upload.cachedImagePath || upload.croppedUri,
      })),
      clientUploadIds: completedUploads.map((upload) => upload.id),
      processedItems: completedUploads.map((upload) => upload.item),
      skipUpload: true, // Add flag to indicate items are already processed
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <InstructionBanner text="For best results, find a product photo with a clean background and no people or models in the image." />
      <UrlHeader
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        handleUrlSubmit={() => {
          let url = urlInput.trim();
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
          }
          setUrlInput(url);
          setProductUrl(url);
          Keyboard.dismiss();
          webViewRef.current?.reload();
        }}
        isUrlFocused={isUrlFocused}
        setIsUrlFocused={setIsUrlFocused}
        webViewRef={webViewRef}
        onBack={() => navigation.goBack()}
        canGoBack={navigationState.canGoBack}
        canGoForward={navigationState.canGoForward}
      />
      <WebViewSection
        viewShotRef={viewShotRef}
        webViewRef={webViewRef}
        urlInput={urlInput}
        setProductUrl={setProductUrl}
        isMounted={isMounted}
        setViewReady={setViewReady}
        onNavigationStateChange={setNavigationState}
      />
      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      {/* Floating button - redesigned for better integration */}
      {!loading && (
        <View
          style={[
            styles.footer,
            processedUploads.length > 0 && styles.footerWithPending,
          ]}
        >
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCaptureProduct}
              disabled={loading}
            >
              <Text style={styles.captureButtonText}>
                {processedUploads.length > 0
                  ? `+${processedUploads.length}`
                  : "Capture"}
              </Text>
            </TouchableOpacity>
            {processedUploads.length > 0 && (
              <View style={styles.pendingIndicator}>
                <Text style={styles.pendingIndicatorText}>
                  {processedUploads.length}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      <EnhancedCropModal
        visible={showCropModal}
        imageUri={screenshotUri}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        processingImage={processingImage}
      />
      <PendingUploadsBar
        pendingUploads={processedUploads}
        onRemoveUpload={removeProcessedUpload}
        onUploadAll={handleUploadAll}
        isUploading={isProcessing}
        uploadCount={processedUploads.length}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  captureButton: {
    backgroundColor: "#111827",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
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
