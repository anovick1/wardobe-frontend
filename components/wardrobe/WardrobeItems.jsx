import React from "react";
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

export default function WardrobeItems() {
  const { wardrobeItems: rawItems, loadingWardrobe } = useWardrobe();
  const wardrobeItems = [...rawItems].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const navigation = useNavigation();
  const [deletedItemIds, setDeletedItemIds] = React.useState([]);

  const renderItem = ({ item }) => {
    if (deletedItemIds.includes(item.id)) return null;
    return (
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={() =>
          navigation.navigate("WardrobeItemDetail", {
            item,
            onDelete: () => setDeletedItemIds((ids) => [...ids, item.id]),
          })
        }
      >
        <View style={cardStyles.card}>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={cardStyles.image} />
          )}
          {/* Info section below image */}
          <View style={cardStyles.infoSection}>
            <Text
              style={typography.name}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.name || "Unnamed item"}
            </Text>
            {item.brand && (
              <Text style={typography.brand} numberOfLines={1}>
                {item.brand}
              </Text>
            )}
            {item.price && (
              <Text style={typography.price} numberOfLines={1}>
                ${item.price}
              </Text>
            )}
            {item.tags && item.tags.length > 0 && (
              <View style={cardStyles.tagsRow}>
                {item.tags.map((tag, idx) => (
                  <View key={idx} style={[cardStyles.tag, tagColorStyle(tag)]}>
                    <Text style={cardStyles.tagText} numberOfLines={1}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={["left", "right"]}>
      {loadingWardrobe ? (
        <ActivityIndicator
          testID="wardrobe-loading"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : wardrobeItems.length === 0 ? (
        <Text style={[styles.emptyText]}>No wardrobe items yet.</Text>
      ) : (
        <FlatList
          data={wardrobeItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          extraData={deletedItemIds}
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
    paddingHorizontal: 4,
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
