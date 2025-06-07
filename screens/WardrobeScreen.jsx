import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import WardrobeItems from "../components/wardrobe/WardrobeItems";
import Outfits from "../components/wardrobe/Outfits";
import VisionBoards from "../components/wardrobe/VisionBoards";
import Capsules from "../components/wardrobe/Capsules";
import Recommendations from "../components/wardrobe/Recommendations";
import AddNewModal from "../components/wardrobe/AddNewModal";
import ProcessingOverlay from "../components/common/ProcessingOverlay";

const tabs = ["Wardrobe", "Outfits", "Boards", "Capsules", "Smart"];

export default function WardrobeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("Wardrobe");
  const [processing, setProcessing] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Wardrobe":
        return <WardrobeItems refreshFlag={refreshFlag} />;
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
            <Text style={activeTab === tab ? styles.activeText : styles.tabText}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>{renderTabContent()}</View>

      {!processing && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

      <AddNewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
        setProcessing={setProcessing}
      />
    </View>
  );
}

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
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontSize: 30,
    marginBottom: 2,
  },
});
