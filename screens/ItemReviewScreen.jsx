import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import api from "../api";
import { useWardrobe } from "../contexts/WardrobeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import CachedImage from "../components/common/CachedImage";
import { Shadow } from "react-native-shadow-2";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

export default function ItemReviewScreen({ route, navigation: navFromProps }) {
  const navigation = useNavigation();
  const { item } = route.params || {};
  const { fetchWardrobeItems } = useWardrobe();
  const scrollRef = useRef();

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
  const [productLink, setProductLink] = useState(
    item?.product_link || item?.product_link || ""
  );
  const [tags, setTags] = useState(
    Array.isArray(item?.tags)
      ? item.tags.join(", ")
      : item?.gpt_metadata?.tags?.join(", ") || ""
  );
  const [newBrand, setNewBrand] = useState(item?.gpt_metadata?.brand || "");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollToEnd = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

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
        const res = await api.post("/brands/add_brand", {
          name: newBrand.trim(),
        });
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
      setSaving(true);
      if (!resolvedItemId) throw new Error("No item ID provided");

      const brand_id = await resolveBrandId();
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name,
        brand_id,
        description,
        primary_color: primaryColor,
        price: price ? parseFloat(price) : null,
        product_link: productLink,
        tags: parsedTags,
      };

      console.log("📤 PUT payload:", payload);

      await api.put(`/wardrobe_items/${resolvedItemId}`, payload);
      await fetchWardrobeItems();

      if (route.params?.onSave) {
        route.params.onSave();
        navigation.goBack();
      } else {
        navigation.navigate("WardrobeHome");
      }
    } catch (err) {
      console.error("❌ Save failed:", err);
      Alert.alert("Error", err.message || "Failed to save item. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // Restore tab bar when entering this screen
  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: undefined });
    }
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back-ios" size={24} color="#121416" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Item</Text>
          <View style={styles.headerIcon} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                {(item?.image_url || item?.presigned_urls?.cleaned) && (
                  <View style={styles.imageContainer}>
                    <CachedImage
                      imageUrl={
                        item.image_url
                          ? item.image_url
                          : item.presigned_urls?.cleaned
                      }
                      itemId={item.item_id || item.id}
                      style={styles.image}
                    />
                  </View>
                )}
                <View style={styles.infoSection}>
                  <LabeledInput label="Name" value={name} setValue={setName} />

                  <Text style={styles.label}>Brand</Text>
                  <DropDownPicker
                    open={brandDropdownOpen}
                    setOpen={(open) => {
                      setBrandDropdownOpen(open);
                      if (open) scrollToEnd();
                    }}
                    items={brandOptions}
                    value={brand}
                    setValue={setBrand}
                    searchable
                    placeholder="Select brand"
                    style={styles.dropdown}
                    containerStyle={{
                      marginBottom: brandDropdownOpen ? 150 : 20,
                    }}
                  />
                  <Text style={styles.small}>or enter new brand</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="New Brand"
                    value={newBrand}
                    onChangeText={setNewBrand}
                    onFocus={scrollToEnd}
                  />

                  <LabeledInput
                    label="Description"
                    value={description}
                    setValue={setDescription}
                  />
                  <LabeledInput
                    label="Primary Color"
                    value={primaryColor}
                    setValue={setPrimaryColor}
                  />
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
                </View>
              </View>
              {saving && (
                <View style={styles.savingOverlay}>
                  <ActivityIndicator size="large" color="#000" />
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ScrollView>

      {!saving && (
        <View style={styles.floatingFooter}>
          <Shadow
            distance={15}
            startColor={"#00000010"}
            offset={[0, 0]}
            radius={18}
            containerViewStyle={{ width: 250, alignSelf: "center" }}
          >
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.submitButtonText}>Confirm and Save</Text>
            </TouchableOpacity>
          </Shadow>
        </View>
      )}
    </View>
  );
}

function LabeledInput({ label, value, setValue, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    padding: 0,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 220,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoSection: {
    padding: 22,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 8,
    fontSize: 14,
    color: "#121416",
  },
  small: {
    fontSize: 12,
    marginBottom: 4,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    borderRadius: 8,
    marginBottom: 2,
    fontSize: 15,
    backgroundColor: "#f8fafc",
    color: "#121416",
  },
  dropdown: {
    borderColor: "#e5e7eb",
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  floatingFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    zIndex: 20,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "rgba(230, 250, 255, 0.9)",
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: "center",
    paddingHorizontal: 16,
    width: 250,
    // maxWidth: 250,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  headerIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140,
  },
});
