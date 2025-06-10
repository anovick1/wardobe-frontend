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
import useCachedImage from "../../hooks/useCachedImage";
import * as FileSystem from "expo-file-system";
import WardrobeItemCard from "./WardrobeItemCard";

export default function WardrobeItems({
  refreshFlag = 0,
  onItemDeleted = () => {},
}) {
  const { wardrobeItems: rawItems, loadingWardrobe } = useWardrobe();
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    setItems(
      [...rawItems].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
    );
  }, [rawItems]);

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

  const handleItemDeleted = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (onItemDeleted) onItemDeleted();
  };

  const renderItem = ({ item }) => (
    <WardrobeItemCard
      item={item}
      navigation={navigation}
      onItemDeleted={handleItemDeleted}
    />
  );

  return (
    <SafeAreaView style={globalStyles.container} edges={["left", "right"]}>
      {loadingWardrobe ? (
        <ActivityIndicator
          testID="wardrobe-loading"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : items.length === 0 ? (
        <Text style={[styles.emptyText]}>No wardrobe items yet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          extraData={refreshFlag}
        />
      )}
    </SafeAreaView>
  );
}

const tagColorStyle = (tag) => {
  // Simple color mapping for demo; you can expand this
  if (/work/i.test(tag)) return { backgroundColor: "#e0f2fe" };
  if (/elegant/i.test(tag)) return { backgroundColor: "#fce7f3" };
  if (/casual/i.test(tag)) return { backgroundColor: "#e0e7ff" };
  if (/basics?/i.test(tag)) return { backgroundColor: "#ccfbf1" };
  if (/cozy/i.test(tag)) return { backgroundColor: "#fef3c7" };
  if (/winter/i.test(tag)) return { backgroundColor: "#e5e7eb" };
  return { backgroundColor: "#f1f5f9" };
};

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
