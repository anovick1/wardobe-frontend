import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ExpoImageCropTool from "expo-image-crop-tool";

const EnhancedCropModal = ({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
  processingImage,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCrop = async () => {
    if (!imageUri) return;

    try {
      setIsProcessing(true);
      
      // Try to use the advanced cropper with all features
      const cropped = await ExpoImageCropTool.openCropperAsync({
        imageUri: imageUri,
        // Allow free aspect ratio for more flexibility
        // aspectRatio: 1, // Uncomment for square crop
        format: "jpeg",
        compressImageQuality: 0.9,
        // Enable advanced features
        enableRotation: true,
        enableZoom: true,
        enablePan: true,
        // Custom styling
        backgroundColor: "#000000",
        overlayColor: "rgba(0, 0, 0, 0.5)",
        cropFrameColor: "#ffffff",
        cropFrameWidth: 2,
        cropFrameCornerColor: "#ffffff",
        cropFrameCornerSize: 20,
        cropFrameCornerWidth: 3,
        // Grid lines
        showGrid: true,
        gridColor: "rgba(255, 255, 255, 0.3)",
        gridLineWidth: 1,
        // Instructions
        instructions: "Drag to move, pinch to zoom, rotate with two fingers",
      });

      if (!cropped || !cropped.path) {
        throw new Error("Failed to crop image - no path returned");
      }

      onCropComplete(cropped.path);
    } catch (err) {
      console.error("Crop error:", err);
      
      if (err.message.includes("cancel")) {
        onCancel();
        return;
      }
      
      // If advanced cropping fails, try basic cropping
      try {
        console.log("Falling back to basic cropping...");
        const basicCropped = await ExpoImageCropTool.openCropperAsync({
          imageUri: imageUri,
          format: "jpeg",
          compressImageQuality: 0.9,
        });
        
        if (!basicCropped || !basicCropped.path) {
          throw new Error("Basic cropping also failed");
        }
        
        onCropComplete(basicCropped.path);
      } catch (basicErr) {
        console.error("Basic crop also failed:", basicErr);
        Alert.alert(
          "Crop Error",
          "Unable to open the crop tool. Please try again or contact support if the issue persists.",
          [{ text: "OK", onPress: onCancel }]
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.previewContainer}>
          <View style={styles.header}>
            <Text style={styles.previewTitle}>Crop & Edit Image</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              disabled={isProcessing}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="zoom-in" size={18} color="#666" />
                <Text style={styles.featureText}>Pinch to zoom in/out</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="pan-tool" size={18} color="#666" />
                <Text style={styles.featureText}>Drag to move the image</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="rotate-right" size={18} color="#666" />
                <Text style={styles.featureText}>Two fingers to rotate</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="crop" size={18} color="#666" />
                <Text style={styles.featureText}>Resize crop area</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.cropButton]}
                onPress={handleCrop}
                disabled={isProcessing || processingImage}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="crop" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.cropButtonText}>Start Cropping</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      justifyContent: "center",
      alignItems: "center",
    },
    previewContainer: {
      backgroundColor: "#fff",
      borderRadius: 20,
      width: "92%",
      maxWidth: 400,
      maxHeight: "85%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    previewTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#111827",
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    featureList: {
      marginBottom: 24,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    featureText: {
      marginLeft: 12,
      fontSize: 15,
      color: "#4b5563",
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: "#f3f4f6",
    },
    cropButton: {
      backgroundColor: "#111827",
    },
    cancelButtonText: {
      color: "#374151",
      fontSize: 15,
      fontWeight: "600",
    },
    cropButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    buttonIcon: {
      marginRight: 6,
    },
  });
  

export default EnhancedCropModal; 