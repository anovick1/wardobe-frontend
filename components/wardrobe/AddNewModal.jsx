import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { handleImageUploadFlow } from "../../flows/handleImageUploadFlow";
import { useWardrobe } from "../../contexts/WardrobeContext";

export default function AddNewModal({
  visible,
  onClose,
  navigation,
  setProcessing,
}) {
  const { addWardrobeItem } = useWardrobe();

  const handleUpload = async (launchFn) => {
    const res = await launchFn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setProcessing(true);
      onClose();
      await handleImageUploadFlow(
        () => Promise.resolve(res),
        navigation,
        false,
        setProcessing,
        addWardrobeItem
      );
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission denied");
      return;
    }
    await handleUpload(ImagePicker.launchCameraAsync);
  };

  const launchGallery = async () => {
    await handleUpload(ImagePicker.launchImageLibraryAsync);
  };

  const handleLinkUpload = () => {
    onClose();
    navigation.navigate("AddLink", { addWardrobeItem });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Pressable style={styles.opt} onPress={launchCamera}>
            <Text style={styles.optText}>📷 Take Photo</Text>
          </Pressable>

          <Pressable style={styles.opt} onPress={launchGallery}>
            <Text style={styles.optText}>🖼️ Upload Photo</Text>
          </Pressable>

          <Pressable style={styles.opt} onPress={handleLinkUpload}>
            <Text style={styles.optText}>🔗 Paste Product Link</Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text style={[styles.optText, { color: "#888" }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  opt: { paddingVertical: 12 },
  optText: { fontSize: 16 },
});
