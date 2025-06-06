import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { Alert } from "react-native";
import api from "../api";

export async function handleImageUploadFlow(
  pickFn,
  navigation,
  requirePermission = false
) {
  try {
    // If permission is required (camera), request it
    if (requirePermission) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera permission denied");
        return;
      }
    }

    const res = await pickFn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (res.canceled) return;

    const uri = res.assets[0].uri;
    const auth = getAuth();
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error("Not signed in");

    const filename = uri.split("/").pop();
    const ext = filename.split(".").pop();
    const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;

    const formData = new FormData();
    formData.append("file", { uri, name: filename, type: mime });

    const { data } = await api.post(
      "/wardrobe_items/upload_and_process",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    navigation.navigate("ItemReview", { item: data });
  } catch (e) {
    console.error("Upload failed:", e);
    Alert.alert("Upload failed", e?.response?.data?.error || e.message);
  }
}
