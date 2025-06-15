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
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImageManipulator from "expo-image-manipulator";
import { auth } from "../firebase";
import api from "../api";
import ExpoImageCropTool from "expo-image-crop-tool";
import { useNavigation } from "@react-navigation/native";
import { Shadow } from "react-native-shadow-2";
import InstructionBanner from "../components/webview/InstructionBanner";
import UrlHeader from "../components/webview/UrlHeader";
import WebViewSection from "../components/webview/WebViewSection";
import CropModal from "../components/common/CropModal";

const WebViewScreen = ({}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("https://www.google.com");
  const [productUrl, setProductUrl] = useState(null);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const webViewRef = useRef(null);
  const viewShotRef = useRef(null);
  const [viewReady, setViewReady] = useState(false);
  const isMounted = useRef(true);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const cropBoxSize = 200; // Size of the crop box

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        setCropPosition((prev) => ({
          x: Math.max(0, Math.min(prev.x + dx, imageSize.width - cropBoxSize)),
          y: Math.max(0, Math.min(prev.y + dy, imageSize.height - cropBoxSize)),
        }));
      },
    })
  ).current;

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
      await handleCropWithPicker(uri, item_id);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to capture screenshot. Please try again. Error: " + err.message
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const handleCropWithPicker = async (uri, item_id) => {
    try {
      setProcessingImage(true);
      const cropped = await ExpoImageCropTool.openCropperAsync({
        imageUri: uri,
        aspectRatio: 1, // for a square crop
        format: "jpeg",
        compressImageQuality: 0.9,
      });
      if (!cropped || !cropped.path) {
        throw new Error("Failed to crop image - no path returned");
      }
      await uploadProductImage(cropped.path, item_id);
    } catch (err) {
      if (err.message.includes("cancel")) {
        return;
      }
      Alert.alert(
        "Error",
        "Failed to crop image. Please try again. Error: " + err.message
      );
    } finally {
      if (isMounted.current) {
        setProcessingImage(false);
      }
    }
  };

  const handleConfirmCrop = async () => {
    if (!screenshotUri) return;
    setShowPreview(false);

    try {
      setProcessingImage(true);
      // Calculate crop dimensions based on the crop box position
      const scale = imageSize.width / 800; // Assuming we want to resize to 800px width
      const cropX = Math.round(cropPosition.x * scale);
      const cropY = Math.round(cropPosition.y * scale);
      const cropSize = Math.round(cropBoxSize * scale);

      const cropped = await ImageManipulator.manipulateAsync(
        screenshotUri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropSize,
              height: cropSize,
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      if (!cropped || !cropped.uri) {
        throw new Error("Failed to crop image - no URI returned");
      }

      await uploadProductImage(cropped.uri, itemId);
    } catch (err) {
      console.error("Image crop failed:", err);
      Alert.alert(
        "Error",
        "Failed to crop image. Please try again. Error: " + err.message
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const handleCancelCrop = () => {
    setShowPreview(false);
    setScreenshotUri(null);
  };

  const uploadProductImage = async (imageUri, item_id) => {
    try {
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
      const cleanedImageUrl = imageResponse.data.cleaned_image_url;

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
          navigation.navigate("ItemReview", {
            itemId,
            imageUrl: cleanedImageUrl,
            item: status,
          });
        } else if (status.status === "failed") {
          Alert.alert(
            "Limited Data Available",
            "We couldn't extract all the product details automatically. You can still add the item manually.",
            [{ text: "OK" }]
          );
          navigation.navigate("ItemReview", {
            itemId,
            imageUrl: cleanedImageUrl,
            item: status,
          });
        } else {
          // Still processing, wait and try again
          setTimeout(pollStatus, 500);
        }
      };

      // Start polling
      pollStatus();
    } catch (err) {
      console.error("Image upload failed:", err);
      Alert.alert("Error", "Failed to upload image. Please try again.");
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
      />
      <WebViewSection
        viewShotRef={viewShotRef}
        webViewRef={webViewRef}
        urlInput={urlInput}
        setProductUrl={setProductUrl}
        isMounted={isMounted}
        setViewReady={setViewReady}
      />
      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      {/* Floating button, only show when not loading */}
      {!loading && (
        <View style={styles.footer}>
          <Shadow
            distance={15}
            startColor={"#00000010"}
            offset={[0, 0]}
            radius={18}
            containerViewStyle={{ width: 250, alignSelf: "center" }}
          >
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCaptureProduct}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>Capture Product</Text>
            </TouchableOpacity>
          </Shadow>
        </View>
      )}
      <CropModal
        showPreview={showPreview}
        handleCancelCrop={handleCancelCrop}
        screenshotUri={screenshotUri}
        imageSize={imageSize}
        setImageSize={setImageSize}
        cropPosition={cropPosition}
        setCropPosition={setCropPosition}
        cropBoxSize={cropBoxSize}
        panResponder={panResponder}
        handleConfirmCrop={handleConfirmCrop}
        processingImage={processingImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "7%",
    backgroundColor: "transparent",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },
  submitButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: "center",
    paddingHorizontal: 16,
    width: 250,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});

export default WebViewScreen;
