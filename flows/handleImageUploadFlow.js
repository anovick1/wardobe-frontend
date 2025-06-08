import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { Alert } from "react-native";
import api from "../api";

export async function handleImageUploadFlow(
  pickFn,
  navigation,
  requirePermission = false,
  setProcessing
) {
  try {
    if (setProcessing) {
      setProcessing(true);
      await new Promise((r) => setTimeout(r, 50));
    }

    if (requirePermission) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera permission denied");
        return;
      }
    }

    const res = await pickFn();
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

    console.log("✅ navigating to ItemReview with item:", data);

    // ✅ Navigate directly to the screen inside the stack
    setTimeout(() => {
      navigation.navigate("ItemReview", { item: data });
    }, 100);
  } catch (e) {
    console.error("Upload failed:", e);
    Alert.alert("Upload failed", e?.response?.data?.error || e.message);
  } finally {
    if (setProcessing) setProcessing(false);
  }
}
