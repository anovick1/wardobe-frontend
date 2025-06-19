import { Alert } from "react-native";

export function validateItemData({ category, subcategory }) {
  if (!category) {
    Alert.alert("Validation Error", "Please select a category");
    return false;
  }

  if (!subcategory) {
    Alert.alert("Validation Error", "Please select a subcategory");
    return false;
  }

  return true;
}

export function buildSavePayload({
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
}) {
  // compute brand id
  const brandMatch = brandOptions.find((b) => b.value === brand);
  const brand_id = brandMatch ? brandMatch.id : null;

  const parsedTags = tags.filter(Boolean);

  // Get category ID
  const selectedCategoryOption = categoryOptions.find(
    (c) => c.value === category
  );
  const categoryId = selectedCategoryOption?.id;

  // Get subcategory ID
  const selectedSubcategory = subcategoryOptions.find(
    (s) => s.value === subcategory
  );
  const subcategoryId = selectedSubcategory?.id;

  return {
    name,
    brand_id,
    description,
    primary_color: primaryColor,
    price: price ? parseFloat(price) : null,
    product_link: productLink,
    tags: parsedTags,
    subcategory_id: subcategoryId,
  };
}
