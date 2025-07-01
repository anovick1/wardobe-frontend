import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const CropModal = ({
  showPreview,
  handleCancelCrop,
  screenshotUri,
  imageSize,
  setImageSize,
  cropPosition,
  setCropPosition,
  cropBoxSize,
  panResponder,
  handleConfirmCrop,
  processingImage,
}) => (
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
            disabled={processingImage}
          >
            <Text style={styles.previewButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewButton, styles.confirmButton]}
            onPress={handleConfirmCrop}
            disabled={processingImage}
          >
            <Text style={styles.previewButtonText}>Confirm & Crop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
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

export default CropModal;
