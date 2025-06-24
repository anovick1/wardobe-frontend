import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const OutfitFilterButtons = ({ onFilterChange, activeFilters = [] }) => {
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);

  const filterOptions = [
    {
      key: "daily",
      label: "Daily",
      icon: "event",
      color: "#FF6B6B",
      backgroundColor: "#FFE8E8",
    },
    {
      key: "ai",
      label: "AI",
      icon: "auto-awesome",
      color: "#4ECDC4",
      backgroundColor: "#E8FFFE",
    },
    {
      key: "you",
      label: "You",
      icon: "person",
      color: "#45B7D1",
      backgroundColor: "#E8F4FD",
    },
    {
      key: "worn",
      label: "Worn",
      icon: "check-circle",
      color: "#10b981",
      backgroundColor: "#dcfce7",
    },
  ];

  const handleFilterPress = (filterKey) => {
    const newFilters = selectedFilters.includes(filterKey)
      ? selectedFilters.filter(f => f !== filterKey)
      : [...selectedFilters, filterKey];
    
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const isFilterActive = (filterKey) => {
    return selectedFilters.includes(filterKey);
  };

  return (
    <ScrollView
      style={{ marginHorizontal: 0 }}
      contentContainerStyle={styles.filterRow}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
    >
      {filterOptions.map((filter) => {
        const isActive = isFilterActive(filter.key);
        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              isActive && {
                backgroundColor: filter.color,
                borderColor: filter.color,
              },
            ]}
            onPress={() => handleFilterPress(filter.key)}
          >
            <Icon
              name={filter.icon}
              size={16}
              color={isActive ? "#fff" : filter.color}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterText,
                { color: isActive ? "#fff" : filter.color },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 0,
    marginBottom: 8,
    marginTop: 2,
  },
  filterButton: {
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
  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default OutfitFilterButtons;