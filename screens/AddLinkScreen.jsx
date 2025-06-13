import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Keyboard,
  Image,
  Modal,
  Dimensions,
  ScrollView,
  PanResponder,
  InteractionManager,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImageManipulator from "expo-image-manipulator";
import ViewShot from "react-native-view-shot";
import { auth } from "../firebase";
import api from "../api";
import ExpoImageCropTool from "expo-image-crop-tool";

const AddLinkScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("https://www.google.com");
  const [productUrl, setProductUrl] = useState(null);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [itemId, setItemId] = useState(null);
  const [showScreenshotButton, setShowScreenshotButton] = useState(false);
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

  const handleSubmit = async () => {
    if (!productUrl) {
      Alert.alert("Error", "Please navigate to a product page first.");
      return;
    }
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();
      const response = await api.post(
        "/wardrobe_items/extract_product_metadata",
        { url: productUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { item_id, status } = response.data;
      if (item_id && status === "processing") {
        setItemId(item_id);
        setShowScreenshotButton(true);
        Alert.alert(
          "Success",
          "Product metadata is being extracted. Please capture a screenshot of the product."
        );
      } else {
        throw new Error("Failed to extract product metadata");
      }
    } catch (err) {
      console.error("❌ Metadata extraction failed:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.error ||
          err.message ||
          "Failed to extract product metadata. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async () => {
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

      console.log("📸 Screenshot captured:", uri);
      setScreenshotUri(uri);
      await handleCropWithPicker(uri);
    } catch (err) {
      console.error("❌ Screenshot capture failed:", err);
      Alert.alert(
        "Error",
        "Failed to capture screenshot. Please try again. Error: " + err.message
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const handleCropWithPicker = async (uri) => {
    try {
      setProcessingImage(true);

      const cropped = await ExpoImageCropTool.openCropperAsync({
        imageUri: uri,
        aspectRatio: 1, // for a square crop
        format: "jpeg",
        compressImageQuality: 0.9,
      });

      console.log("✅ Cropper result:", cropped);

      if (!cropped || !cropped.path) {
        throw new Error("Failed to crop image - no path returned");
      }

      await uploadProductImage(cropped.path);
    } catch (err) {
      if (err.message.includes("cancel")) {
        console.log("Cropping cancelled by user.");
        // User cancelled, so we just return without an error
        return;
      }

      console.error("❌ Image crop failed:", err);
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

      await uploadProductImage(cropped.uri);
    } catch (err) {
      console.error("❌ Image crop failed:", err);
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

  const uploadProductImage = async (imageUri) => {
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
        `/wardrobe_items/${itemId}/process_product_image`,
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
        const itemResponse = await api.get(`/wardrobe_items/${itemId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      console.error("❌ Image upload failed:", err);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  const handleUrlSubmit = () => {
    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    setUrlInput(url);
    setProductUrl(url);
    Keyboard.dismiss();
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.urlContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="Enter URL"
            value={urlInput}
            onChangeText={setUrlInput}
            onSubmitEditing={handleUrlSubmit}
            onFocus={() => setIsUrlFocused(true)}
            onBlur={() => setIsUrlFocused(false)}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="go"
          />
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => webViewRef.current?.reload()}
          >
            <Icon name="refresh" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ViewShot
        ref={viewShotRef}
        style={styles.webViewContainer}
        options={{ format: "jpg", quality: 0.9 }}
        collapsable={false}
        onLayout={() => setViewReady(true)}
      >
        <WebView
          ref={webViewRef}
          source={{ uri: urlInput }}
          style={styles.webView}
          onNavigationStateChange={(navState) => {
            if (isMounted.current && navState.url) {
              setProductUrl(navState.url);
            }
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
            </View>
          )}
        />
      </ViewShot>

      <View style={styles.footer}>
        {showScreenshotButton ? (
          <TouchableOpacity
            style={[
              styles.screenshotButton,
              processingImage && styles.submitButtonDisabled,
            ]}
            onPress={handleScreenshot}
            disabled={processingImage}
          >
            {processingImage ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon
                  name="camera-alt"
                  size={24}
                  color="#fff"
                  style={styles.cameraIcon}
                />
                <Text style={styles.submitButtonText}>Capture Product</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Link</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelCrop}
      >
        <View style={styles.modalContainer}>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Position Crop Box</Text>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: screenshotUri }}
                style={styles.previewImage}
                resizeMode="contain"
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  setImageSize({ width, height });
                }}
              />
              <View
                {...panResponder.panHandlers}
                style={[
                  styles.cropBox,
                  {
                    left: cropPosition.x,
                    top: cropPosition.y,
                    width: cropBoxSize,
                    height: cropBoxSize,
                  },
                ]}
              >
                <View style={styles.cropBoxBorder} />
              </View>
            </View>
            <Text style={styles.cropInstructions}>
              Drag the box to position it over the product
            </Text>
            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.previewButton, styles.cancelButton]}
                onPress={handleCancelCrop}
              >
                <Text style={styles.previewButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewButton, styles.confirmButton]}
                onPress={handleConfirmCrop}
              >
                <Text style={styles.previewButtonText}>Confirm & Crop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  urlContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  urlInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#000",
  },
  refreshButton: {
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webView: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  screenshotButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cameraIcon: {
    marginRight: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 400,
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  cropBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  cropBoxBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#fff",
  },
  cropInstructions: {
    textAlign: "center",
    marginBottom: 16,
    color: "#666",
  },
  previewButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
  },
  confirmButton: {
    backgroundColor: "#000",
  },
  previewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddLinkScreen;
