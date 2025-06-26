import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FilterModal from "../wardrobe/FilterModal";

const OutfitFilterButtons = ({ 
  onFilterChange, 
  activeFilters = {}, 
  outfits = []
}) => {
  const [filters, setFilters] = useState(activeFilters);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState(null);

  // Quick filters that don't need modals
  const quickFilters = [
    {
      key: "worn",
      label: "Worn",
      icon: "check-circle",
      color: "#10b981",
      backgroundColor: "#dcfce7",
    },
  ];

  // Filter types that open modals (simplified)
  const modalFilterTypes = ["Outfit Type", "Tags"];

  // Extract unique values for simplified filters (outfit properties only)
  const getFilterOptions = (filterType) => {
    const type = filterType.toLowerCase().replace(' ', '_');
    
    if (type === 'outfit_type') {
      return ['Manual', 'AI Generated', 'Daily Outfit'];
    }
    
    if (type === 'tags') {
      const uniqueTags = new Set();
      
      outfits.forEach(outfit => {
        if (outfit.tags && Array.isArray(outfit.tags)) {
          outfit.tags.forEach(tag => uniqueTags.add(tag));
        }
      });
      
      return Array.from(uniqueTags).sort();
    }
    
    return [];
  };

  const handleQuickFilterPress = (filterKey) => {
    const newFilters = { ...filters };
    const currentQuickFilters = newFilters.quick || [];
    
    if (currentQuickFilters.includes(filterKey)) {
      newFilters.quick = currentQuickFilters.filter(f => f !== filterKey);
      if (newFilters.quick.length === 0) {
        delete newFilters.quick;
      }
    } else {
      newFilters.quick = [...currentQuickFilters, filterKey];
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleModalFilterPress = (filterType) => {
    setSelectedFilterType(filterType.toLowerCase().replace(' ', '_'));
    setModalVisible(true);
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

  const isQuickFilterActive = (filterKey) => {
    return filters.quick && filters.quick.includes(filterKey);
  };

  const isModalFilterActive = (filterType) => {
    const type = filterType.toLowerCase().replace(' ', '_');
    return filters[type] && Array.isArray(filters[type]) && filters[type].length > 0;
  };

  const getModalFilterCount = (filterType) => {
    const type = filterType.toLowerCase().replace(' ', '_');
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
        {/* Quick filters */}
        {quickFilters.map((filter) => {
          const isActive = isQuickFilterActive(filter.key);
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.quickFilterButton,
                isActive && {
                  backgroundColor: filter.color,
                  borderColor: filter.color,
                },
              ]}
              onPress={() => handleQuickFilterPress(filter.key)}
            >
              <Icon
                name={filter.icon}
                size={16}
                color={isActive ? "#fff" : filter.color}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.quickFilterText,
                  { color: isActive ? "#fff" : filter.color },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Modal filters */}
        {modalFilterTypes.map((filterType) => {
          const count = getModalFilterCount(filterType);
          return (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.modalFilterButton,
                isModalFilterActive(filterType) && styles.activeModalFilterButton,
              ]}
              onPress={() => handleModalFilterPress(filterType)}
            >
              <Text
                style={[
                  styles.modalFilterText,
                  isModalFilterActive(filterType) && styles.activeModalFilterText,
                ]}
              >
                {filterType}{count > 0 ? ` (${count})` : ''}
              </Text>
              <Icon
                name="expand-more"
                size={20}
                color={isModalFilterActive(filterType) ? "#fff" : "#6a7681"}
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
  quickFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalFilterButton: {
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
  activeModalFilterButton: {
    backgroundColor: "#121416",
  },
  modalFilterText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 2,
  },
  activeModalFilterText: {
    color: "#fff",
  },
});

export default OutfitFilterButtons;