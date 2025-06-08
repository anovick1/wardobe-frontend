import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Button,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api";

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
  } = item;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {image_url && <Image source={{ uri: image_url }} style={styles.image} />}

      <Text style={styles.label}>Name:</Text>
      <Text style={styles.value}>{name}</Text>

      <Text style={styles.label}>Brand:</Text>
      <Text style={styles.value}>{brand}</Text>

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{description}</Text>

      <Text style={styles.label}>Primary Color:</Text>
      <Text style={styles.value}>{primary_color}</Text>

      <Text style={styles.label}>Size:</Text>
      <Text style={styles.value}>{size || "N/A"}</Text>

      <Text style={styles.label}>Price:</Text>
      <Text style={styles.value}>{price ? `$${price}` : "N/A"}</Text>

      <Text style={styles.label}>Tags:</Text>
      <Text style={styles.value}>{tags.length ? tags.join(", ") : "N/A"}</Text>

      <Text style={styles.label}>Times Worn:</Text>
      <Text style={styles.value}>{times_worn}</Text>

      <Text style={styles.label}>Favorite:</Text>
      <Text style={styles.value}>{is_favorite ? "Yes" : "No"}</Text>

      <View style={styles.editButtonContainer}>
        <Button
          title="Edit Item"
          onPress={() =>
            navigation.navigate("ItemReview", {
              item,
            })
          }
        />
        <View style={{ marginTop: 12 }}>
          <Button
            title="Delete Item"
            color="#d32f2f"
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
                        Alert.alert("Item deleted");
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
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  editButtonContainer: {
    marginTop: 30,
  },
});
