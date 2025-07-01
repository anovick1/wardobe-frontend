import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { debounce } from "../utils/searchUtils";
import { PanGestureHandler, State } from "react-native-gesture-handler";

import WardrobeItems from "../components/wardrobe/WardrobeItems";
import Outfits from "../components/wardrobe/Outfits";
import VisionBoards from "../components/wardrobe/VisionBoards";
import Capsules from "../components/wardrobe/Capsules";
import Recommendations from "../components/wardrobe/Recommendations";
import AddNewModal from "../components/wardrobe/AddNewModal";
import FilterButtons from "../components/wardrobe/FilterButtons";
import OutfitFilterButtons from "../components/outfits/OutfitFilterButtons";
import { useWardrobe } from "../contexts/WardrobeContext";
import { useOutfits } from "../contexts/OutfitContext";

const tabs = ["Wardrobe", "Outfits", "Boards", "Capsules", "Smart"];
const { width: screenWidth } = Dimensions.get("window");

export default function WardrobeScreen({ navigation, route }) {
  const initialTabParam = route?.params?.initialTab;
  const [activeTab, setActiveTab] = useState(initialTabParam || "Wardrobe");
  const [modalVisible, setModalVisible] = useState(false);
  const [wardrobeFilters, setWardrobeFilters] = useState({});
  const [outfitFilters, setOutfitFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const outfitsRef = useRef();
  const { wardrobeItems } = useWardrobe();
  const { outfits: rawOutfits, allOutfits } = useOutfits();

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  // Initialize tab indicator position based on initial tab
  const initialTabIndex = tabs.indexOf(initialTabParam || "Wardrobe");
  const initialPosition = initialTabIndex !== -1 ? initialTabIndex * (screenWidth / tabs.length) : 0;
  const tabIndicatorPosition = useRef(new Animated.Value(initialPosition)).current;

  // Debounce search query for performance
  const debouncedSearch = useMemo(
    () => debounce((query) => setDebouncedSearchQuery(query), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

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
      const newIndex = tabs.indexOf(route.params.initialTab);
      if (newIndex !== -1) {
        animateTabIndicator(newIndex);
      }
    }
  }, [route?.params?.initialTab]);


  // Handle navigation to specific outfit detail
  useEffect(() => {
    if (route?.params?.outfitId) {
      const outfitId = route.params.outfitId;
      // Navigate to OutfitDetail screen
      navigation.navigate("OutfitDetail", { outfitId });
    }
  }, [route?.params?.outfitId, navigation]);

  const handleWardrobeFilterChange = (filters) => {
    setWardrobeFilters(filters);
  };

  const handleOutfitFilterChange = (filters) => {
    setOutfitFilters(filters);
  };

  // Animate tab transitions
  const animateTabChange = (direction) => {
    // Fade out and slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === "left" ? -30 : 30,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset and fade back in
      slideAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  // Handle tab change from tap
  const handleTabPress = (tab) => {
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(tab);
    if (currentIndex !== newIndex) {
      animateTabChange(newIndex > currentIndex ? "left" : "right");
      animateTabIndicator(newIndex);
      setActiveTab(tab);
    }
  };

  // Animate tab indicator
  const animateTabIndicator = (index) => {
    const tabWidth = screenWidth / tabs.length;
    Animated.spring(tabIndicatorPosition, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  // Handle swipe gestures
  const handleSwipe = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { translationX } = nativeEvent;
      const currentIndex = tabs.indexOf(activeTab);

      if (translationX > 50 && currentIndex > 0) {
        // Swipe right - go to previous tab
        animateTabChange("right");
        animateTabIndicator(currentIndex - 1);
        setActiveTab(tabs[currentIndex - 1]);
      } else if (translationX < -50 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        animateTabChange("left");
        animateTabIndicator(currentIndex + 1);
        setActiveTab(tabs[currentIndex + 1]);
      }
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      {/* Tabs */}
      <View style={styles.headerContainer}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabPress(tab)}
              style={styles.tab}
            >
              <Text
                style={activeTab === tab ? styles.activeText : styles.tabText}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{ translateX: tabIndicatorPosition }],
                width: screenWidth / tabs.length,
              },
            ]}
          />
        </View>
        {/* Unified search/filters/actions for Wardrobe and Outfits tabs */}
        {(activeTab === "Wardrobe" || activeTab === "Outfits") && (
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
                placeholder={
                  activeTab === "Wardrobe"
                    ? "Search your wardrobe"
                    : "Search outfits"
                }
                placeholderTextColor="#6a7681"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearButton}
                >
                  <Icon name="clear" size={20} color="#6a7681" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Buttons */}
            {activeTab === "Wardrobe" && (
              <FilterButtons
                onFilterChange={handleWardrobeFilterChange}
                activeFilters={wardrobeFilters}
                wardrobeItems={wardrobeItems || []}
              />
            )}
            {activeTab === "Outfits" && (
              <View style={styles.outfitFiltersContainer}>
                <OutfitFilterButtons
                  onFilterChange={handleOutfitFilterChange}
                  activeFilters={outfitFilters}
                  outfits={rawOutfits || []}
                />
              </View>
            )}
          </>
        )}
      </View>

      <PanGestureHandler onHandlerStateChange={handleSwipe}>
        <Animated.View
          style={{
            flex: 1,
            minHeight: 0,
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {activeTab === "Wardrobe" && (
            <WardrobeItems
              filters={wardrobeFilters}
              searchQuery={debouncedSearchQuery}
            />
          )}
          {activeTab === "Outfits" && (
            <Outfits
              ref={outfitsRef}
              filters={outfitFilters}
              searchQuery={debouncedSearchQuery}
            />
          )}
          {activeTab === "Boards" && <VisionBoards />}
          {activeTab === "Capsules" && <Capsules />}
          {activeTab === "Smart" && <Recommendations />}
        </Animated.View>
      </PanGestureHandler>

      {/* Bottom Action Buttons */}
      {(activeTab === "Wardrobe" || activeTab === "Outfits") && (
        <View style={styles.bottomActionsContainer}>
          {activeTab === "Wardrobe" && (
            <TouchableOpacity
              style={styles.bottomActionButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="add" size={24} color="#121416" />
              <Text style={styles.bottomActionButtonText}>Add Item</Text>
            </TouchableOpacity>
          )}
          {activeTab === "Outfits" && (
            <>
              <TouchableOpacity
                style={styles.bottomActionButton}
                onPress={() => navigation.navigate("CreateOutfit")}
              >
                <Icon name="add" size={24} color="#121416" />
                <Text style={styles.bottomActionButtonText}>Create Outfit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bottomActionButton,
                  styles.bottomActionButtonPrimary,
                ]}
                onPress={() => outfitsRef.current?.openAIGenerator()}
              >
                <Icon name="auto-awesome" size={24} color="#fff" />
                <Text
                  style={[
                    styles.bottomActionButtonText,
                    styles.bottomActionButtonTextPrimary,
                  ]}
                >
                  AI Generate
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <AddNewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
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
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    position: "relative",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    flex: 1,
    alignItems: "center",
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
  outfitFiltersContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    height: 40,
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
  clearButton: {
    padding: 8,
    marginRight: 4,
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
  bottomActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  bottomActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bottomActionButtonPrimary: {
    backgroundColor: "#121416",
    borderColor: "#121416",
  },
  bottomActionButtonText: {
    color: "#121416",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  bottomActionButtonTextPrimary: {
    color: "#fff",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    height: 3,
    backgroundColor: "#121416",
    // left: 0,
    marginHorizontal: 0,
  },
});
