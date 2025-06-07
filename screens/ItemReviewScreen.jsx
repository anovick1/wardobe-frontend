import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import api from "../api";

export default function ItemReviewScreen({ route, navigation }) {
  const { item } = route.params;
  const itemId = item.item_id || item.id;

  const [name, setName] = useState(item.name || "");
  const [brand, setBrand] = useState(item.brand || null);
  const [brandOptions, setBrandOptions] = useState([]);
  const [description, setDescription] = useState(item.description || item.gpt_metadata?.raw || "");
  const [primaryColor, setPrimaryColor] = useState(item.primary_color || item.color || "");
  const [price, setPrice] = useState(item.price ? String(item.price) : "");
  const [productLink, setProductLink] = useState(item.product_link || "");
  const [tags, setTags] = useState(
    Array.isArray(item.tags) ? item.tags.join(", ") : item.gpt_metadata?.tags?.join(", ") || ""
  );
  const [newBrand, setNewBrand] = useState(item.gpt_metadata?.brand || "");

  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await api.get("/brands");
      const options = res.data.map((b) => ({
        label: b.name,
        value: b.name,
        id: b.id,
      }));
      setBrandOptions(options);
    } catch (err) {
      console.error("Failed to load brands", err);
    }
  };

  const handleSave = async () => {
    try {
      const resolvedItemId = itemId;
      if (!resolvedItemId) throw new Error("No item ID provided");

      let brandId = null;

      if (newBrand) {
        try {
          const res = await api.post("/brands/add_brand", { name: newBrand });
          brandId = res.data.id;
        } catch (err) {
          if (err.response?.status === 409) {
            const brands = await api.get("/brands");
            const match = brands.data.find(
              (b) => b.name.toLowerCase() === newBrand.toLowerCase()
            );
            if (match) brandId = match.id;
            else throw new Error("Brand exists but could not be retrieved.");
          } else {
            throw err;
          }
        }
      } else if (brand) {
        const match = brandOptions.find((b) => b.value === brand);
        if (match) brandId = match.id;
      }

      const tagList = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await api.put(`/wardrobe_items/${resolvedItemId}`, {
        name,
        brand_id: brandId,
        description,
        primary_color: primaryColor,
        price: price ? parseFloat(price) : null,
        product_link: productLink,
        tags: tagList,
      });

      Alert.alert("Success", "Item updated successfully");
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save item", err);
      Alert.alert("Error", "Failed to save item. Try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Brand</Text>
      <DropDownPicker
        open={brandDropdownOpen}
        setOpen={setBrandDropdownOpen}
        items={brandOptions}
        value={brand}
        setValue={setBrand}
        searchable={true}
        placeholder="Select brand"
        style={styles.dropdown}
        containerStyle={{ marginBottom: brandDropdownOpen ? 150 : 20 }}
      />
      <Text style={styles.small}>or enter new brand</Text>
      <TextInput
        style={styles.input}
        placeholder="New Brand"
        value={newBrand}
        onChangeText={setNewBrand}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Primary Color</Text>
      <TextInput
        style={styles.input}
        value={primaryColor}
        onChangeText={setPrimaryColor}
      />

      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Product Link</Text>
      <TextInput
        style={styles.input}
        value={productLink}
        onChangeText={setProductLink}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={tags}
        onChangeText={setTags}
        placeholder="e.g. casual,summer,beach"
      />

      <View style={{ marginTop: 20 }}>
        <Button title="CONFIRM AND SAVE" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 14,
  },
  small: {
    fontSize: 12,
    marginBottom: 4,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  dropdown: {
    borderColor: "#ccc",
    marginBottom: 10,
  },
});
