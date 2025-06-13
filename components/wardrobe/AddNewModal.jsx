import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useWardrobe } from "../../contexts/WardrobeContext";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";

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
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!res.canceled) {
      setProcessing(true);
      onClose();
      navigation.navigate("MultiUpload", { images: res.assets });
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
    navigation.navigate("AddLink");
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={cardStyles.modalSheet}>
          <Pressable onPress={launchCamera}>
            <Text style={typography.modalOption}>📷 Take Photo</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={launchGallery}>
            <Text style={typography.modalOption}>🖼️ Upload Photos</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={handleLinkUpload}>
            <Text style={typography.modalOption}>🔗 Add Item via Web</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={onClose}>
            <Text style={typography.modalOptionCancel}>Cancel</Text>
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
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 2,
    alignSelf: "stretch",
  },
});
