import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import ClothingItems from "../components/wardrobe/ClothingItems";
import Outfits from "../components/wardrobe/Outfits";
import VisionBoards from "../components/wardrobe/VisionBoards";
import Capsules from "../components/wardrobe/Capsules";
import Recommendations from "../components/wardrobe/Recommendations";
import AddNewButton from "../components/wardrobe/AddNewButton";

const tabs = ["Wardrobe", "Outfits", "Boards", "Capsules", "Smart"];

const WardrobeScreen = () => {
  const [activeTab, setActiveTab] = useState("Clothing");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Wardrobe":
        return <ClothingItems />;
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
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={activeTab === tab ? styles.activeText : styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>{renderTabContent()}</View>

      <AddNewButton />
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
