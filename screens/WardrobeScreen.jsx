import React, { useState } from "react";
import { InteractionManager } from "react-native";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import ClothingItems from "../components/wardrobe/ClothingItems";
import Outfits from "../components/wardrobe/Outfits";
import VisionBoards from "../components/wardrobe/VisionBoards";
import Capsules from "../components/wardrobe/Capsules";
import Recommendations from "../components/wardrobe/Recommendations";
import AddNewButton from "../components/wardrobe/AddNewButton";
import { getAuth } from "firebase/auth";
import api from "../api";
import ProcessingOverlay from "../components/common/ProcessingOverlay";

const tabs = ["Wardrobe", "Outfits", "Boards", "Capsules", "Smart"];

const WardrobeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("Wardrobe");
  const [processing, setProcessing] = useState(false);
  console.log(processing);

  const [refreshFlag, setRefreshFlag] = useState(0);

  const handleImagePicked = (uri) => {
    // 1️⃣ show spinner IMMEDIATELY
    setProcessing(true);

    // 2️⃣ wait until camera / gallery sheet is completely gone
    InteractionManager.runAfterInteractions(async () => {
      try {
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Not signed in");

        const filename = uri.split("/").pop();
        const ext = filename.split(".").pop();
        const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;

        const formData = new FormData();
        formData.append("file", { uri, name: filename, type: mime });

        await api.post("/wardrobe_items/upload_and_process", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${idToken}`,
          },
        });

        // refresh list + jump to Wardrobe tab
        setActiveTab("Wardrobe");
        setRefreshFlag((f) => f + 1);
      } catch (err) {
        Alert.alert("Upload failed", err?.response?.data?.error || err.message);
      } finally {
        // 3️⃣ hide spinner
        setProcessing(false);
      }
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Wardrobe":
        return <ClothingItems refreshFlag={refreshFlag} />;
      case "Outfits":
        return <Outfits />;
      case "Boards":
        return <VisionBoards />;
      case "Capsules":
        return <Capsules />;
      case "Smart":
        return <Recommendations />;
      default:
        return <Text>Select a tab</Text>;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {processing && <ProcessingOverlay />}

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={activeTab === tab ? styles.activeText : styles.tabText}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>{renderTabContent()}</View>

      {!processing && (
        <AddNewButton
          navigation={navigation}
          onStartUpload={handleImagePicked}
          setProcessing={setProcessing}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#f2f2f2",
  },
  tab: {
    padding: 10,
  },
  tabText: {
    color: "#666",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: "#000",
  },
  activeText: {
    fontWeight: "bold",
    color: "#000",
  },
});

export default WardrobeScreen;
