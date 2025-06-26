import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FilterModal from "./FilterModal";
import CategoryFilterModal from "./CategoryFilterModal";
import { useItemFormData } from "../../hooks/useItemFormData";

const FilterButtons = ({ 
  onFilterChange, 
  activeFilters = {}, 
  wardrobeItems = [],
  filterOptions = {}
}) => {
  const [filters, setFilters] = useState(activeFilters);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState(null);
  
  const { categoryOptions, subcategoryOptions } = useItemFormData();

  const filterTypeOptions = ["Brand", "Category", "Color", "Tags"];

  // Extract unique values for each filter type
  const getFilterOptions = (filterType) => {
    const type = filterType.toLowerCase();
    
    if (filterOptions[type] && filterOptions[type].length > 0) {
      return filterOptions[type];
    }

    // Fallback: extract from wardrobe items
    const uniqueValues = new Set();
    
    wardrobeItems.forEach(item => {
      switch (type) {
        case 'brand':
          if (item.brand) uniqueValues.add(item.brand);
          break;
        case 'category':
          if (item.category && item.subcategory) {
            uniqueValues.add(`${item.category} - ${item.subcategory}`);
          } else if (item.category) {
            uniqueValues.add(item.category);
          } else if (item.subcategory) {
            uniqueValues.add(item.subcategory);
          }
          break;
        case 'color':
          if (item.primary_color) uniqueValues.add(item.primary_color);
          break;
        case 'tags':
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => uniqueValues.add(tag));
          }
          break;
      }
    });
    
    return Array.from(uniqueValues).sort();
  };

  const handleFilterPress = (filterType) => {
    if (filterType.toLowerCase() === 'category') {
      setCategoryModalVisible(true);
    } else {
      setSelectedFilterType(filterType.toLowerCase());
      setModalVisible(true);
    }
  };

  const handleApplyFilter = (selectedValues) => {
    const newFilters = { ...filters };
    
    if (selectedValues.length === 0) {
      delete newFilters[selectedFilterType];
    } else {
      newFilters[selectedFilterType] = selectedValues;
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleApplyCategoryFilter = ({ categories, subcategories }) => {
    const newFilters = { ...filters };
    
    // Convert hierarchical selection to legacy category filter format
    const legacyCategories = [];
    
    // Add selected categories as standalone filters
    categories.forEach(categoryId => {
      const category = categoryOptions.find(cat => cat.id === categoryId);
      if (category) {
        legacyCategories.push(category.label);
      }
    });
    
    // Add selected subcategories as "Category - Subcategory" format
    subcategories.forEach(subcategoryId => {
      const subcategory = subcategoryOptions.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        const parentCategory = categoryOptions.find(cat => cat.id === subcategory.category_id);
        if (parentCategory) {
          legacyCategories.push(`${parentCategory.label} - ${subcategory.label}`);
        }
      }
    });
    
    // Update the legacy category filter
    if (legacyCategories.length === 0) {
      delete newFilters.category;
      delete newFilters.categories;
      delete newFilters.subcategories;
    } else {
      newFilters.category = legacyCategories;
      // Store hierarchical data for UI state
      newFilters.categories = categories;
      newFilters.subcategories = subcategories;
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const isFilterActive = (filterType) => {
    const type = filterType.toLowerCase();
    if (type === 'category') {
      return (filters.categories && filters.categories.length > 0) || 
             (filters.subcategories && filters.subcategories.length > 0);
    }
    return filters[type] && Array.isArray(filters[type]) && filters[type].length > 0;
  };

  const getFilterCount = (filterType) => {
    const type = filterType.toLowerCase();
    if (type === 'category') {
      const categoryCount = filters.categories ? filters.categories.length : 0;
      const subcategoryCount = filters.subcategories ? filters.subcategories.length : 0;
      return categoryCount + subcategoryCount;
    }
    return filters[type] ? filters[type].length : 0;
  };

  return (
    <>
      <ScrollView
        style={{ marginHorizontal: 0 }}
        contentContainerStyle={styles.filterRow}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        {filterTypeOptions.map((filterType) => {
          const count = getFilterCount(filterType);
          return (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                isFilterActive(filterType) && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterPress(filterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  isFilterActive(filterType) && styles.activeFilterText,
                ]}
              >
                {filterType}{count > 0 ? ` (${count})` : ''}
              </Text>
              <Icon
                name="expand-more"
                size={20}
                color={isFilterActive(filterType) ? "#fff" : "#6a7681"}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        filterType={selectedFilterType}
        options={selectedFilterType ? getFilterOptions(selectedFilterType) : []}
        selectedValues={selectedFilterType ? (filters[selectedFilterType] || []) : []}
        onApply={handleApplyFilter}
      />

      <CategoryFilterModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        categories={categoryOptions}
        subcategories={subcategoryOptions}
        selectedCategories={filters.categories || []}
        selectedSubcategories={filters.subcategories || []}
        onApply={handleApplyCategoryFilter}
      />
    </>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 0,
    marginBottom: 8,
    marginTop: 2,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
  activeFilterButton: {
    backgroundColor: "#121416",
  },
  filterText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 2,
  },
  activeFilterText: {
    color: "#fff",
  },
});

export default FilterButtons;