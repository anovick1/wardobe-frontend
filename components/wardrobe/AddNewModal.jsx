import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function AddNewModal({
  visible,
  onClose,
  onImagePicked,
  navigation,
  setProcessing,
}) {
  const handleResult = async (res) => {
    if (res.canceled) return;
    onImagePicked(res.assets[0].uri); // Triggers upload in parent
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission denied");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      onImagePicked(res.assets[0].uri); // 🚀 triggers upload
    }
  };

  const launchGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      onImagePicked(res.assets[0].uri); // 🚀 triggers upload
    }
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

          <Pressable
            style={styles.opt}
            onPress={() => {
              onClose();
              navigation.navigate("AddLink");
            }}
          >
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
