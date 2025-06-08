import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Button,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function WardrobeItemDetail({ route }) {
  const { item } = route.params;
  const navigation = useNavigation();

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
      {image_url && (
        <Image source={{ uri: image_url }} style={styles.image} />
      )}

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
