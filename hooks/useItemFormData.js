import { useState, useEffect } from "react";
import api from "../api";

export function useItemFormData() {
  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const loadBrands = async () => {
    try {
      const { data } = await api.get("/brands/");
      const formatted = data.map((b) => ({
        label: b.name,
        value: b.name,
        id: b.id,
      }));
      setBrandOptions(formatted);
    } catch (err) {
      console.error("Failed to load brands", err);
      // Add fallback brands for debugging
      const fallbackBrands = [
        { label: "Nike", value: "Nike", id: "temp-nike" },
        { label: "Adidas", value: "Adidas", id: "temp-adidas" },
        { label: "Marine Layer", value: "Marine Layer", id: "temp-marine" },
      ];
      setBrandOptions(fallbackBrands);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data } = await api.get("/wardrobe_categories");
      const formatted = data.map((c) => ({
        label: c.category,
        value: c.category,
        id: c.id,
      }));
      setCategoryOptions(formatted);
    } catch (err) {
      console.error("Failed to load categories", err);
      // Temporary fallback for debugging
      const fallbackCategories = [
        { label: "Clothing", value: "Clothing", id: "temp-clothing" },
        { label: "Footwear", value: "Footwear", id: "temp-footwear" },
        { label: "Accessories", value: "Accessories", id: "temp-accessories" },
      ];
      setCategoryOptions(fallbackCategories);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubcategories = async () => {
    try {
      setLoadingSubcategories(true);
      const { data } = await api.get("/wardrobe_subcategories");
      const formatted = data.map((s) => ({
        label: s.subcategory,
        value: s.subcategory,
        id: s.id,
        category_id: s.category_id,
      }));
      setSubcategoryOptions(formatted);
    } catch (err) {
      console.error("Failed to load subcategories", err);
      // Temporary fallback for debugging
      const fallbackSubcategories = [
        {
          label: "Tops",
          value: "Tops",
          id: "temp-tops",
          category_id: "temp-clothing",
        },
        {
          label: "Bottoms",
          value: "Bottoms",
          id: "temp-bottoms",
          category_id: "temp-clothing",
        },
        {
          label: "Sneakers",
          value: "Sneakers",
          id: "temp-sneakers",
          category_id: "temp-footwear",
        },
      ];
      setSubcategoryOptions(fallbackSubcategories);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleBrandSelect = async (item) => {
    if (item.isNew) {
      try {
        const res = await api.post("/brands/add_brand", { name: item.value });
        const newOpt = {
          label: item.value,
          value: item.value,
          id: res.data.id,
        };
        setBrandOptions((prev) => [...prev, newOpt]);
        return item.value;
      } catch (err) {
        console.error("Failed adding brand", err);
        return null;
      }
    }
    return item.value;
  };

  useEffect(() => {
    loadBrands();
    loadCategories();
    loadSubcategories();
  }, []);

  return {
    brandOptions,
    categoryOptions,
    subcategoryOptions,
    loadingCategories,
    loadingSubcategories,
    handleBrandSelect,
  };
}
