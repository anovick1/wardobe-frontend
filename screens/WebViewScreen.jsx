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

const WebViewScreen = ({}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("https://www.google.com");
  const [productUrl, setProductUrl] = useState(null);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const webViewRef = useRef(null);
  const viewShotRef = useRef(null);
  const [viewReady, setViewReady] = useState(false);
  const isMounted = useRef(true);
  
  // New state for multiple uploads
  const [pendingUploads, setPendingUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
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

  const handleCropComplete = (croppedUri) => {
    setShowCropModal(false);
    // Add to pending uploads
    addToPendingUploads(croppedUri, null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setScreenshotUri(null);
  };

  const addToPendingUploads = (croppedUri, itemId) => {
    const newUpload = {
      id: Date.now() + Math.random(),
      croppedUri,
      itemId,
      status: "pending",
    };
    setPendingUploads(prev => [...prev, newUpload]);
  };

  const removeFromPendingUploads = (uploadId) => {
    setPendingUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const uploadAllPending = async () => {
    if (pendingUploads.length === 0) return;

    try {
      setIsUploading(true);
      const token = await auth.currentUser.getIdToken();
      
      // Create FormData with all images
      const formData = new FormData();
      const clientUploadIds = [];

      pendingUploads.forEach((upload, index) => {
        const clientUploadId = `${Date.now()}-${index}`;
        clientUploadIds.push(clientUploadId);
        
        formData.append("files", {
          uri: Platform.OS === "android" ? upload.croppedUri : upload.croppedUri.replace("file://", ""),
          type: "image/jpeg",
          name: `product_image_${index}.jpg`,
        });
      });

      // Add client upload IDs
      clientUploadIds.forEach(id => {
        formData.append("client_upload_ids", id);
      });

      // Upload all images at once
      const response = await api.post(
        "/wardrobe_items/upload_and_process",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Bulk upload started:", response.data);

      // Navigate to MultiUploadScreen to handle the processing
      navigation.navigate("MultiUpload", { 
        images: pendingUploads.map(upload => ({ uri: upload.croppedUri })),
        clientUploadIds 
      });

      // Clear pending uploads
      setPendingUploads([]);
    } catch (err) {
      console.error("Bulk upload failed:", err);
      Alert.alert(
        "Error",
        "Failed to upload images. Please try again. Error: " + err.message
      );
    } finally {
      setIsUploading(false);
    }
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
        <View style={[
          styles.footer,
          pendingUploads.length > 0 && styles.footerWithPending
        ]}>
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCaptureProduct}
              disabled={loading}
            >
              <Text style={styles.captureButtonText}>
                {pendingUploads.length > 0 ? `+${pendingUploads.length}` : "Capture"}
              </Text>
            </TouchableOpacity>
            {pendingUploads.length > 0 && (
              <View style={styles.pendingIndicator}>
                <Text style={styles.pendingIndicatorText}>{pendingUploads.length}</Text>
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
        pendingUploads={pendingUploads}
        onRemoveUpload={removeFromPendingUploads}
        onUploadAll={uploadAllPending}
        isUploading={isUploading}
        uploadCount={pendingUploads.length}
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
