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
import { useWardrobe } from "../contexts/WardrobeContext";
import useCachedImage from "../hooks/useCachedImage";
import * as FileSystem from "expo-file-system";
import { tagColorStyle } from "../utils/tagStyles";
import { Ionicons } from "@expo/vector-icons";

export default function WardrobeItemDetail({ route, navigation }) {
  const { item } = route.params;
  const { removeWardrobeItem } = useWardrobe();

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
    category,
    subcategory,
  } = item;

  return (
    <SafeAreaView
      style={{ backgroundColor: "#fff", flex: 1 }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="#121416" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wardrobe Item Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate("ItemReview", { item })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="edit" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
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
                        removeWardrobeItem(item.id);
                        Alert.alert("Success", "Item deleted successfully");
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={24} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Brand above image */}
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{name}</Text>
          {brand ? <Text style={styles.brand}>{brand}</Text> : null}
        </View>
        {/* Image Section */}
        <View style={styles.imageCard}>
          {image_url ? (
            <CachedImage
              imageUrl={image_url}
              itemId={item.id}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="image" size={80} color="#ccc" />
              <Text style={styles.placeholderText}>No item image</Text>
            </View>
          )}
        </View>
        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsGrid}>
            {category && (
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{category}</Text>
              </View>
            )}
            {subcategory && (
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Subcategory</Text>
                <Text style={styles.detailValue}>{subcategory}</Text>
              </View>
            )}
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
          {!!description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
        {/* Tags Section */}
        {tags.length > 0 && (
          <View style={styles.tagsCard}>
            <Text style={styles.tagsLabel}>Tags</Text>
            <View style={styles.tagsRow}>
              {tags.map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      {/* Sticky Add to Outfit Button */}
      <View style={styles.addToOutfitBar}>
        <TouchableOpacity
          style={styles.addToOutfitButton}
          onPress={() =>
            navigation.navigate("CreateOutfit", { selectedItem: item })
          }
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
    </SafeAreaView>
  );
}

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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerActionBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageCard: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 220,
    marginBottom: 0,
    marginTop: 0,
    overflow: "hidden",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "500",
  },
  titleContainer: {
    padding: 16,
  },
  name: {
    color: "#121416",
    fontWeight: "bold",
    fontSize: 22,
    marginBottom: 2,
  },
  brand: {
    color: "#6a7681",
    fontSize: 14,
    fontWeight: "500",
  },
  detailsCard: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
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
  tagsCard: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  tagsLabel: {
    color: "#121416",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  addToOutfitBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
