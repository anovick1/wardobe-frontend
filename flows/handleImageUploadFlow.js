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

    // ✅ Navigate directly to the screen inside the stack
    setTimeout(() => {
      navigation.navigate("ItemReview", { item: data });
    }, 100);
  } catch (e) {
    console.error("Upload failed:", e);
    
    // Check if it's a clothing detection error from the bulk upload response
    const errorMessage = e?.response?.data?.error || e.message;
    const isClothingError = errorMessage === "Image is not a clothing item";
    
    Alert.alert(
      isClothingError ? "Not a Clothing Item" : "Upload Failed",
      isClothingError 
        ? "The image doesn't appear to contain a clothing item. Please try taking a photo of clothing items only."
        : errorMessage,
      [{ text: "OK", style: "default" }]
    );
  } finally {
    if (setProcessing) setProcessing(false);
  }
}
