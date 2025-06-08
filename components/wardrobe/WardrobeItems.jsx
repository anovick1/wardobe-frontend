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
        onPress={() =>
          navigation.navigate("WardrobeItemDetail", {
            item,
            onDelete: () => setDeletedItemIds((ids) => [...ids, item.id]),
          })
        }
      >
        <View style={cardStyles.card}>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          )}

          {item.brand && (
            <Text style={typography.meta}>
              Brand: <Text style={{ fontWeight: "bold" }}>{item.brand}</Text>
            </Text>
          )}

          <Text style={typography.name}>{item.name || "Unnamed item"}</Text>

          {!!item.description && (
            <Text style={typography.description}>{item.description}</Text>
          )}

          <Text style={typography.category}>
            {item.primary_color || "Unknown color"} – {item.size || "No size"}
          </Text>

          <Text style={typography.meta}>
            Times worn: {item.times_worn ?? 0} • Favorite:{" "}
            {item.is_favorite ? "Yes" : "No"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={globalStyles.container}>
      {loadingWardrobe ? (
        <ActivityIndicator
          testID="wardrobe-loading"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : wardrobeItems.length === 0 ? (
        <Text style={[typography.meta, { marginTop: 30 }]}>
          No wardrobe items yet.
        </Text>
      ) : (
        <FlatList
          data={wardrobeItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={globalStyles.list}
          extraData={deletedItemIds}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
});
