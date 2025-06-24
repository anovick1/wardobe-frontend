import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";

import WardrobeItems from "../components/wardrobe/WardrobeItems";
import Outfits from "../components/wardrobe/Outfits";
import VisionBoards from "../components/wardrobe/VisionBoards";
import Capsules from "../components/wardrobe/Capsules";
import Recommendations from "../components/wardrobe/Recommendations";
import AddNewModal from "../components/wardrobe/AddNewModal";
import ProcessingOverlay from "../components/common/ProcessingOverlay";
import FilterButtons from "../components/wardrobe/FilterButtons";
import { useWardrobe } from "../contexts/WardrobeContext";

const tabs = ["Wardrobe", "Outfits", "Boards", "Capsules", "Smart"];

export default function WardrobeScreen({ navigation, route }) {
  const initialTabParam = route?.params?.initialTab;
  const [activeTab, setActiveTab] = useState(initialTabParam || "Wardrobe");
  const [processing, setProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [wardrobeFilters, setWardrobeFilters] = useState({});
  const { wardrobeItems } = useWardrobe();

  useFocusEffect(
    React.useCallback(() => {
      // Reset active tab to 'Wardrobe' when the screen comes into focus
      // setActiveTab("Wardrobe");
      // Navigate to the initial route of the Wardrobe stack
      navigation.navigate("WardrobeHome");
    }, [navigation])
  );

  // Update active tab if navigation param changes while screen is already mounted
  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  const handleFilterChange = (filters) => {
    setWardrobeFilters(filters);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Wardrobe":
        return <WardrobeItems filters={wardrobeFilters} />;
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      {processing && <ProcessingOverlay />}

      {/* Tabs */}
      <View style={styles.headerContainer}>
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
        {/* Only show search/filters on Wardrobe tab */}
        {activeTab === "Wardrobe" && (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Icon
                name="search"
                size={22}
                color="#6a7681"
                style={{ marginLeft: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your wardrobe"
                placeholderTextColor="#6a7681"
                editable={false}
              />
            </View>
            {/* Filter Buttons */}
            <FilterButtons
              onFilterChange={handleFilterChange}
              activeFilters={wardrobeFilters}
              wardrobeItems={wardrobeItems || []}
            />
          </>
        )}
      </View>

      <View style={{ flex: 1, minHeight: 0 }}>{renderTabContent()}</View>

      {!processing && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === "Outfits") {
              navigation.navigate("CreateOutfit");
            } else {
              setModalVisible(true);
            }
          }}
        >
          <Icon name="add" size={32} color="#121416" />
        </TouchableOpacity>
      )}

      <AddNewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
        setProcessing={setProcessing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#fff",
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 10,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#121416",
  },
  tabText: {
    color: "#6a7681",
    fontWeight: "500",
    fontSize: 15,
  },
  activeText: {
    color: "#121416",
    fontWeight: "bold",
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    height: 44,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#121416",
    backgroundColor: "transparent",
    borderWidth: 0,
    marginLeft: 8,
    fontFamily: "System",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 0,
    marginBottom: 8,
    marginTop: 2,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
  filterText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 2,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dce8f3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 20,
  },
});
