import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Image, Button, Alert } from "react-native";
import api from "../api";

export default function ItemReviewScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName] = useState(item.name || "");
  const [brand, setBrand] = useState(item.brand || "");
  const [description, setDescription] = useState(item.description || "");
  const [primaryColor, setPrimaryColor] = useState(item.primary_color || "");

  const handleConfirm = async () => {
    try {
      await api.put(`/wardrobe_items/${item.id}`, {
        name,
        brand,
        description,
        primary_color: primaryColor,
      });

      navigation.navigate("Wardrobe");
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.error || err.message);
    }
  };

  return (
    <View style={styles.container}>
      {item.image_url && <Image source={{ uri: item.image_url }} style={styles.image} />}
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Brand</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} />

      <Text style={styles.label}>Primary Color</Text>
      <TextInput style={styles.input} value={primaryColor} onChangeText={setPrimaryColor} />

      <Button title="Confirm and Save" onPress={handleConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  image: { width: "100%", height: 200, borderRadius: 10, marginBottom: 20 },
  label: { fontWeight: "bold", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginTop: 4,
  },
});
