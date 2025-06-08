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
import { useWardrobe } from "../contexts/WardrobeContext";

export default function ItemReviewScreen({ route, navigation }) {
  const { item } = route.params || {};
  const { fetchWardrobeItems } = useWardrobe();

  const resolvedItemId = item?.item_id || item?.id;

  const [name, setName] = useState(item?.name || "");
  const [brand, setBrand] = useState(item?.brand || null);
  const [brandOptions, setBrandOptions] = useState([]);
  const [description, setDescription] = useState(
    item?.description || item?.gpt_metadata?.raw || ""
  );
  const [primaryColor, setPrimaryColor] = useState(
    item?.primary_color || item?.color || ""
  );
  const [price, setPrice] = useState(item?.price ? String(item.price) : "");
  const [productLink, setProductLink] = useState(item?.product_link || "");
  const [tags, setTags] = useState(
    Array.isArray(item?.tags)
      ? item.tags.join(", ")
      : item?.gpt_metadata?.tags?.join(", ") || ""
  );
  const [newBrand, setNewBrand] = useState(item?.gpt_metadata?.brand || "");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data } = await api.get("/brands");
      const formatted = data.map((b) => ({
        label: b.name,
        value: b.name,
        id: b.id,
      }));
      setBrandOptions(formatted);
    } catch (err) {
      console.error("❌ Failed to load brands", err);
    }
  };

  const resolveBrandId = async () => {
    if (newBrand?.trim()) {
      try {
        const res = await api.post("/brands/add_brand", { name: newBrand.trim() });
        return res.data.id;
      } catch (err) {
        if (err.response?.status === 409) {
          const { data } = await api.get("/brands");
          const existing = data.find(
            (b) => b.name.toLowerCase() === newBrand.trim().toLowerCase()
          );
          if (existing) return existing.id;
          throw new Error("Brand exists but could not be retrieved.");
        }
        throw err;
      }
    } else if (brand) {
      const match = brandOptions.find((b) => b.value === brand);
      return match?.id || null;
    }
    return null;
  };

  const handleSave = async () => {
    try {
      if (!resolvedItemId) throw new Error("No item ID provided");

      const brand_id = await resolveBrandId();
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await api.put(`/wardrobe_items/${resolvedItemId}`, {
        name,
        brand_id,
        description,
        primary_color: primaryColor,
        price: price ? parseFloat(price) : null,
        product_link: productLink,
        tags: parsedTags,
      });

      await fetchWardrobeItems();

      Alert.alert("Success", "Item updated successfully");
      navigation.goBack();
    } catch (err) {
      console.error("❌ Save failed:", err);
      Alert.alert("Error", err.message || "Failed to save item. Try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LabeledInput label="Name" value={name} setValue={setName} />

      <Text style={styles.label}>Brand</Text>
      <DropDownPicker
        open={brandDropdownOpen}
        setOpen={setBrandDropdownOpen}
        items={brandOptions}
        value={brand}
        setValue={setBrand}
        searchable
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

      <LabeledInput label="Description" value={description} setValue={setDescription} />
      <LabeledInput label="Primary Color" value={primaryColor} setValue={setPrimaryColor} />
      <LabeledInput
        label="Price"
        value={price}
        setValue={setPrice}
        keyboardType="numeric"
      />
      <LabeledInput
        label="Product Link"
        value={productLink}
        setValue={setProductLink}
        autoCapitalize="none"
      />
      <LabeledInput
        label="Tags (comma separated)"
        value={tags}
        setValue={setTags}
        placeholder="e.g. casual, summer, vacation"
      />

      <View style={{ marginTop: 20 }}>
        <Button title="CONFIRM AND SAVE" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

function LabeledInput({ label, value, setValue, ...props }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        {...props}
      />
    </>
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
