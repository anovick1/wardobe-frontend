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

export default function WardrobeItems({ filters = {} }) {
  const {
    wardrobeItems: rawItems,
    loadingWardrobe,
    loadingMoreWardrobe,
    loadMoreWardrobeItems,
    currentPage,
    totalPages,
    hasMoreWardrobe,
  } = useWardrobe();

  // Filter items based on active filters
  const filterItems = (items) => {
    if (Object.keys(filters).length === 0) {
      return items;
    }

    return items.filter((item) => {
      // Check brand filter
      if (filters.brand && filters.brand.length > 0) {
        if (!item.brand || !filters.brand.includes(item.brand)) {
          return false;
        }
      }

      // Check category filter
      if (filters.category && filters.category.length > 0) {
        let itemCategory = '';
        if (item.category && item.subcategory) {
          itemCategory = `${item.category} - ${item.subcategory}`;
        } else if (item.category) {
          itemCategory = item.category;
        } else if (item.subcategory) {
          itemCategory = item.subcategory;
        }
        
        if (!itemCategory || !filters.category.includes(itemCategory)) {
          return false;
        }
      }

      // Check color filter
      if (filters.color && filters.color.length > 0) {
        if (!item.primary_color || !filters.color.includes(item.primary_color)) {
          return false;
        }
      }

      // Check tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!item.tags || !Array.isArray(item.tags)) {
          return false;
        }
        
        // Check if item has at least one of the selected tags
        const hasMatchingTag = filters.tags.some(selectedTag => 
          item.tags.includes(selectedTag)
        );
        
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  };

  const items = filterItems(rawItems);

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
