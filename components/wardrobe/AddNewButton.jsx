import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking"; // keep if you’ll open URLs

export default function AddNewButton({ navigation }) {
  const [visible, setVisible] = useState(false);

  /* ----- helpers ----- */
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
    handleResult(res);
  };

  const launchGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    handleResult(res);
  };

  const handleResult = (res) => {
    setVisible(false);
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    console.log("Picked image URI:", uri);
    // navigation.navigate("Upload", { uri });
  };

  const handleProductLink = () => {
    setVisible(false);
    // navigation.navigate("AddLink")  OR  prompt here
    console.log("Paste product link flow");
  };

  /* ----- ui ----- */
  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setVisible(true)}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Pressable style={styles.opt} onPress={launchCamera}>
              <Text style={styles.optText}>📷 Take Photo</Text>
            </Pressable>
            <Pressable style={styles.opt} onPress={launchGallery}>
              <Text style={styles.optText}>🖼️ Upload Photo</Text>
            </Pressable>
            <Pressable style={styles.opt} onPress={handleProductLink}>
              <Text style={styles.optText}>🔗 Paste Product Link</Text>
            </Pressable>

            <Pressable onPress={() => setVisible(false)}>
              <Text style={[styles.optText, { color: "#888" }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ----- styles ----- */
const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#000",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  fabIcon: { color: "#fff", fontSize: 28 },
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
