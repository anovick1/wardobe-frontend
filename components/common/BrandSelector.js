import React, { useEffect, useState } from "react";
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import api from "../../api";

export default function BrandSelector({ selectedBrand, onBrandSelect }) {
  const [brands, setBrands] = useState([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    api.get("/brands/")
      .then(res => setBrands(res.data))
      .catch(err => console.error("Failed to load brands", err));
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(brands.filter(b => b.name.toLowerCase().includes(q)));
  }, [query, brands]);

  const handleSelect = (brand) => {
    onBrandSelect(brand);
    setQuery(brand.name);
  };

  const handleCreate = async () => {
    try {
      const { data } = await api.post("/brands/add_brand", { name: query });
      onBrandSelect(data);
      setBrands((prev) => [...prev, data]);
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      Alert.alert("Could not add brand", msg);
    }
  };

  const brandExists = brands.some(b => b.name.toLowerCase() === query.toLowerCase());

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Search or add brand"
        value={query}
        onChangeText={setQuery}
      />
      {!brandExists && query.length > 2 && (
        <TouchableOpacity onPress={handleCreate}>
          <Text style={styles.createText}>＋ Add "{query}"</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item)}>
            <Text style={styles.item}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1,
    padding: 8,
    marginBottom: 10,
  },
  item: {
    padding: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  createText: {
    color: "#007AFF",
    padding: 8,
    marginBottom: 5,
  },
});
