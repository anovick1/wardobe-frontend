import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import api from "../api";
import { useWardrobe } from "../contexts/WardrobeContext";
import CachedImage from "../components/common/CachedImage";
import SearchablePicker from "../components/common/SearchablePicker";
import ModalTextInput from "../components/common/ModalTextInput";
import ModalTagInput from "../components/common/ModalTagInput";
import FormField from "../components/common/FormField";
import ItemFormSection from "../components/itemReview/ItemFormSection";
import TagsPreview from "../components/itemReview/TagsPreview";
import { useItemFormData } from "../hooks/useItemFormData";
import { validateItemData, buildSavePayload } from "../utils/itemValidation";

export default function ItemReviewScreen({ route }) {
  const navigation = useNavigation();
  const { item } = route.params || {};
  const { updateWardrobeItem } = useWardrobe();
  const resolvedItemId = item?.item_id || item?.id;

  // Form state
  const [name, setName] = useState(item?.name || "");
  const [brand, setBrand] = useState(item?.brand || null);
  const [category, setCategory] = useState(item?.category || null);
  const [subcategory, setSubcategory] = useState(item?.subcategory || null);
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
    Array.isArray(item?.tags) ? item.tags : item?.gpt_metadata?.tags || []
  );
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showPrimaryColorModal, setShowPrimaryColorModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showProductLinkModal, setShowProductLinkModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  // Data from custom hook
  const {
    brandOptions,
    categoryOptions,
    subcategoryOptions,
    loadingCategories,
    loadingSubcategories,
    handleBrandSelect: handleBrandSelectHook,
  } = useItemFormData();

  // Filter subcategories based on selected category
  const filteredSubcategoryOptions = useMemo(() => {
    if (!category || !subcategoryOptions.length || !categoryOptions.length) {
      return [];
    }
    const selectedCategoryOption = categoryOptions.find(
      (c) => c.value === category
    );
    return selectedCategoryOption
      ? subcategoryOptions.filter(
          (s) => s.category_id === selectedCategoryOption.id
        )
      : [];
  }, [category, subcategoryOptions, categoryOptions]);

  // Clear subcategory when category changes
  useEffect(() => {
    if (
      category &&
      subcategory &&
      subcategoryOptions.length &&
      categoryOptions.length
    ) {
      const selectedCategoryOption = categoryOptions.find(
        (c) => c.value === category
      );
      if (selectedCategoryOption) {
        const subcategoryStillValid = subcategoryOptions.some(
          (s) =>
            s.value === subcategory &&
            s.category_id === selectedCategoryOption.id
        );
        if (!subcategoryStillValid) {
          setSubcategory(null);
        }
      }
    }
  }, [category, subcategory, subcategoryOptions, categoryOptions]);

  const handleBrandSelect = async (item) => {
    const selectedBrand = await handleBrandSelectHook(item);
    if (selectedBrand) {
      setBrand(selectedBrand);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!resolvedItemId) throw new Error("No item ID provided");

      // Validate form data
      if (!validateItemData({ category, subcategory })) {
        setSaving(false);
        return;
      }

      // Build payload
      const payload = buildSavePayload({
        name,
        brand,
        brandOptions,
        description,
        primaryColor,
        price,
        productLink,
        tags,
        category,
        categoryOptions,
        subcategory,
        subcategoryOptions,
      });

      // Save item
      const response = await api.put(
        `/wardrobe_items/${resolvedItemId}`,
        payload
      );
      const updatedItem = response.data;

      console.log(
        "📝 PUT response received:",
        updatedItem?.id,
        updatedItem?.name
      );

      // Update context
      updateWardrobeItem(updatedItem);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Navigate
      if (route.params?.fromBulkUpload) {
        if (route.params?.onSave) route.params.onSave(updatedItem);
        navigation.goBack();
      } else {
        navigation.navigate("WardrobeHome");
      }
    } catch (err) {
      console.error("Save failed:", err);
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
    <View style={styles.container}>
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

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              {/* Image Section */}
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

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <ItemFormSection title="Basic Information">
                  <FormField
                    label="NAME"
                    value={name}
                    placeholder="Enter item name"
                    onPress={() => setShowNameModal(true)}
                    icon="edit"
                  />

                  <FormField
                    label="BRAND"
                    value={brand}
                    placeholder="Select brand"
                    onPress={() => setShowBrandPicker(true)}
                    icon="search"
                  />

                  <FormField
                    label="CATEGORY"
                    value={category}
                    placeholder={
                      loadingCategories ? "Loading..." : "Select category"
                    }
                    onPress={() => setShowCategoryPicker(true)}
                    icon="apps"
                    disabled={loadingCategories}
                  />

                  <FormField
                    label="SUBCATEGORY"
                    value={subcategory}
                    placeholder={
                      !category
                        ? "Select a category first"
                        : "Select subcategory"
                    }
                    onPress={() => setShowSubcategoryPicker(true)}
                    icon="category"
                    disabled={!category || loadingSubcategories}
                  />
                </ItemFormSection>

                <ItemFormSection title="Details">
                  <FormField
                    label="DESCRIPTION"
                    value={description}
                    placeholder="Enter product description..."
                    onPress={() => setShowDescriptionModal(true)}
                    icon="edit"
                    numberOfLines={2}
                  />

                  <FormField
                    label="PRIMARY COLOR"
                    value={primaryColor}
                    placeholder="Enter primary color"
                    onPress={() => setShowPrimaryColorModal(true)}
                    icon="palette"
                  />

                  <FormField
                    label="TAGS"
                    placeholder="Add tags..."
                    onPress={() => setShowTagModal(true)}
                    icon="local-offer"
                  >
                    <TagsPreview tags={tags} />
                  </FormField>
                </ItemFormSection>

                <ItemFormSection title="Product Details">
                  <FormField
                    label="PRICE"
                    value={price ? `$${parseFloat(price).toFixed(2)}` : ""}
                    placeholder="Enter price"
                    onPress={() => setShowPriceModal(true)}
                    icon="attach-money"
                  />

                  <FormField
                    label="PRODUCT LINK"
                    value={productLink}
                    placeholder="Enter product link"
                    onPress={() => setShowProductLinkModal(true)}
                    icon="link"
                    numberOfLines={1}
                  />
                </ItemFormSection>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </KeyboardAwareScrollView>

      {!saving && (
        <View style={styles.floatingFooter}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>Confirm and Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}

      {/* Modals */}
      <SearchablePicker
        visible={showBrandPicker}
        onClose={() => setShowBrandPicker(false)}
        title="Select Brand"
        data={brandOptions}
        onSelect={handleBrandSelect}
        selectedValue={brand}
        placeholder="No brands available"
        allowAdd
      />

      <CustomPicker
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Select Category"
        data={categoryOptions}
        onSelect={setCategory}
        selectedValue={category}
        placeholder="No categories available"
        loading={loadingCategories}
      />

      <CustomPicker
        visible={showSubcategoryPicker}
        onClose={() => setShowSubcategoryPicker(false)}
        title="Select Subcategory"
        data={filteredSubcategoryOptions}
        onSelect={setSubcategory}
        selectedValue={subcategory}
        placeholder="No subcategories available"
        loading={loadingSubcategories}
      />

      <ModalTextInput
        visible={showNameModal}
        onClose={() => setShowNameModal(false)}
        title="Item Name"
        value={name}
        onSave={setName}
        placeholder="Enter item name..."
      />

      <ModalTextInput
        visible={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        title="Description"
        value={description}
        onSave={setDescription}
        placeholder="Enter product description..."
        multiline
      />

      <ModalTextInput
        visible={showPrimaryColorModal}
        onClose={() => setShowPrimaryColorModal(false)}
        title="Primary Color"
        value={primaryColor}
        onSave={setPrimaryColor}
        placeholder="Enter primary color..."
      />

      <ModalTextInput
        visible={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        title="Price"
        value={price}
        onSave={setPrice}
        placeholder="Enter price..."
        keyboardType="numeric"
        isPriceInput={true}
      />

      <ModalTextInput
        visible={showProductLinkModal}
        onClose={() => setShowProductLinkModal(false)}
        title="Product Link"
        value={productLink}
        onSave={setProductLink}
        placeholder="Enter product link..."
        keyboardType="url"
      />

      <ModalTagInput
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="Manage Tags"
        tags={tags}
        onSave={setTags}
        placeholder="Add a tag..."
      />
    </View>
  );
}

// CustomPicker component for categories and subcategories
function CustomPicker({
  visible,
  onClose,
  title,
  data,
  onSelect,
  selectedValue,
  placeholder,
  loading = false,
}) {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        selectedValue === item.value && styles.pickerItemSelected,
      ]}
      onPress={() => {
        onSelect(item.value);
        onClose();
      }}
    >
      <Text
        style={[
          styles.pickerItemText,
          selectedValue === item.value && styles.pickerItemTextSelected,
        ]}
      >
        {item.label}
      </Text>
      {selectedValue === item.value && (
        <Icon name="check" size={20} color="#111827" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.pickerCloseButton}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.pickerLoading}>
              <ActivityIndicator size="large" color="#111827" />
              <Text style={styles.pickerLoadingText}>Loading...</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyText}>{placeholder}</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
              style={styles.pickerList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 220,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 0,
    marginTop: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  infoSection: {
    padding: 0,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    backgroundColor: "#111827",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
  },
  headerIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
    color: "#111827",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  contentContainer: {
    paddingBottom: 16,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  pillButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillButtonText: {
    fontSize: 15,
    color: "#111827",
    flex: 1,
    fontWeight: "500",
  },
  pillButtonTextPlaceholder: {
    color: "#9ca3af",
    fontWeight: "400",
  },
  pillButtonDisabled: {
    backgroundColor: "#f9fafb",
    opacity: 0.6,
  },
  tagsPreview: {
    flex: 1,
  },
  tagsPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  tagPreviewChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 2,
  },
  tagPreviewText: {
    fontSize: 12,
    color: "#374151",
  },
  moreTagsText: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
  },
  // Picker modal styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pickerCloseButton: {
    padding: 8,
  },
  pickerLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pickerLoadingText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  pickerEmpty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pickerEmptyText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerList: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: "#f3f4f6",
  },
  pickerItemText: {
    fontSize: 16,
  },
  pickerItemTextSelected: {
    fontWeight: "bold",
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
