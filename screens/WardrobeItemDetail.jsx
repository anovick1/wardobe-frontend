import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Button,
  Alert,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import cardStyles from "../styles/card";
import typography from "../styles/typography";
import CachedImage from "../components/common/CachedImage";

export default function WardrobeItemDetail({ route, navigation }) {
  const { item, onDelete } = route.params;

  const {
    name,
    brand,
    description,
    primary_color,
    size,
    price,
    times_worn,
    is_favorite,
    image_url,
    tags = [],
    product_link,
  } = item;

  return (
    <View style={{ flex: 1 }}>
      {/* Sticky Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back-ios" size={24} color="#121416" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={styles.headerIcon} />
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {image_url && (
          <View style={styles.imageContainer}>
            <CachedImage
              imageUrl={image_url}
              itemId={item.id}
              style={styles.image}
            />
          </View>
        )}
        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name}</Text>
              <Text style={typography.brand}>{brand}</Text>
              {!!description && (
                <Text style={typography.description}>{description}</Text>
              )}
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity>
                <Icon
                  name={is_favorite ? "favorite" : "favorite-border"}
                  size={28}
                  color={is_favorite ? "#e11d48" : "#121416"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (product_link) Linking.openURL(product_link);
                }}
              >
                <Icon
                  name="link"
                  size={28}
                  color={product_link ? "#121416" : "#cbd5e1"}
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Primary Color</Text>
              <Text style={styles.detailValue}>{primary_color || "N/A"}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{size || "N/A"}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>
                {price ? `$${price}` : "N/A"}
              </Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Times Worn</Text>
              <Text style={styles.detailValue}>{times_worn ?? 0}</Text>
            </View>
          </View>
          {/* Tags */}
          {tags.length > 0 && (
            <View style={cardStyles.tagsRow}>
              {tags.map((tag, idx) => (
                <View key={idx} style={[cardStyles.tag, tagColorStyle(tag)]}>
                  <Text style={cardStyles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("ItemReview", { item })}
              activeOpacity={0.7}
            >
              <Icon name="edit" size={20} color="#007AFF" style={{ marginRight: 6 }} />
              <Text style={styles.editButtonText}>Edit Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={async () => {
                Alert.alert(
                  "Delete Item",
                  "Are you sure you want to delete this item?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await api.delete(`/wardrobe_items/${item.id}`);
                          Alert.alert("Success", "Item deleted successfully");
                          if (onDelete) onDelete();
                          navigation.goBack();
                        } catch (err) {
                          Alert.alert("Error", "Failed to delete item.");
                          console.error(err);
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.deleteButtonContent}>
                <Icon
                  name="delete"
                  size={20}
                  color="#e11d48"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.deleteButtonText}>Delete Item</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* Sticky Add to Outfit Button */}
      <View style={styles.addToOutfitBar}>
        <TouchableOpacity 
          style={styles.addToOutfitButton}
          onPress={() => navigation.navigate('CreateOutfit', { selectedItem: item })}
        >
          <Icon
            name="add-shopping-cart"
            size={22}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.addToOutfitText}>Add to Outfit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tagColorStyle = (tag) => {
  if (/work/i.test(tag)) return { backgroundColor: "#e0f2fe" };
  if (/elegant/i.test(tag)) return { backgroundColor: "#fce7f3" };
  if (/casual/i.test(tag)) return { backgroundColor: "#e0e7ff" };
  if (/basics?/i.test(tag)) return { backgroundColor: "#ccfbf1" };
  if (/cozy/i.test(tag)) return { backgroundColor: "#fef3c7" };
  if (/winter/i.test(tag)) return { backgroundColor: "#e5e7eb" };
  return { backgroundColor: "#f1f5f9" };
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    zIndex: 1,
  },
  headerIcon: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    // backgroundColor: "#f1f5f9",
    maxHeight: 220,
    marginBottom: 0,
    marginTop: 0,
    overflow: "hidden",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    // resizeMode: "cover",
  },
  card: {
    // backgroundColor: "#f8f9fa",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 18,
    // shadowColor: "#000",
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: {
    color: "#121416",
    fontWeight: "bold",
    fontSize: 22,
    marginBottom: 2,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 8,
  },
  detailCol: {
    flex: 1,
    minWidth: "45%",
    marginBottom: 8,
  },
  detailLabel: {
    color: "#6a7681",
    fontSize: 12,
    fontWeight: "500",
  },
  detailValue: {
    color: "#121416",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  description: {
    color: "#343A40",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 56,
  },
  editButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 56,
  },
  deleteButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#e11d48",
    fontWeight: "bold",
    fontSize: 15,
  },
  addToOutfitBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: "#fff",
    // borderTopWidth: 1,
    // borderTopColor: "#e5e7eb",
    padding: 16,
    zIndex: 20,
  },
  addToOutfitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121416",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  addToOutfitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
