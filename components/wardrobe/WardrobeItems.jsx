import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useWardrobe } from "../../contexts/WardrobeContext";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";
import globalStyles from "../../styles/global";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import WardrobeItemCard from "./WardrobeItemCard";

export default function WardrobeItems() {
  const {
    wardrobeItems: rawItems,
    loadingWardrobe,
    loadingMoreWardrobe,
    loadMoreWardrobeItems,
    currentPage,
    totalPages,
    hasMoreWardrobe,
  } = useWardrobe();
  const items = rawItems; // order preserved from backend/pagination

  // Cleanup unused cached images
  useEffect(() => {
    async function cleanupCache() {
      try {
        const files = await FileSystem.readDirectoryAsync(
          FileSystem.cacheDirectory
        );
        const validIds = new Set(items.map((i) => `wardrobe-${i.id}.jpg`));
        await Promise.all(
          files
            .filter((f) => f.startsWith("wardrobe-") && !validIds.has(f))
            .map((f) =>
              FileSystem.deleteAsync(FileSystem.cacheDirectory + f, {
                idempotent: true,
              })
            )
        );
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (items.length > 0) cleanupCache();
  }, [items]);

  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <WardrobeItemCard item={item} navigation={navigation} />
  );

  return (
    <SafeAreaView style={globalStyles.container} edges={["left", "right"]}>
      {loadingWardrobe && items.length === 0 ? (
        <Text style={[styles.emptyText]}>No wardrobe items yet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasMoreWardrobe && !loadingMoreWardrobe) {
              loadMoreWardrobeItems();
            }
          }}
          ListFooterComponent={() =>
            loadingMoreWardrobe ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardTouchable: {
    width: "48%",
    margin: "1%",
    minWidth: 0,
  },
  columnWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 16,
  },
  emptyText: {
    color: "#6a7681",
    textAlign: "center",
    marginTop: 30,
    fontSize: 15,
  },
});
