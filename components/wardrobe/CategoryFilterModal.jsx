import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const CategoryFilterModal = ({
  visible,
  onClose,
  categories = [],
  subcategories = [],
  selectedCategories = [],
  selectedSubcategories = [],
  onApply,
}) => {
  const [localSelectedCategories, setLocalSelectedCategories] =
    useState(selectedCategories);
  const [localSelectedSubcategories, setLocalSelectedSubcategories] = useState(
    selectedSubcategories,
  );
  const [activeView, setActiveView] = useState("categories"); // 'categories' or 'subcategories'

  useEffect(() => {
    setLocalSelectedCategories(selectedCategories);
    setLocalSelectedSubcategories(selectedSubcategories);
  }, [selectedCategories, selectedSubcategories]);

  const toggleCategory = (categoryId) => {
    const newSelected = localSelectedCategories.includes(categoryId)
      ? localSelectedCategories.filter((id) => id !== categoryId)
      : [...localSelectedCategories, categoryId];
    setLocalSelectedCategories(newSelected);

    // If deselecting a category, also deselect its subcategories
    if (localSelectedCategories.includes(categoryId)) {
      const categorySubcategories = subcategories
        .filter((sub) => sub.category_id === categoryId)
        .map((sub) => sub.id);

      setLocalSelectedSubcategories((prev) =>
        prev.filter((subId) => !categorySubcategories.includes(subId)),
      );
    }
  };

  const toggleSubcategory = (subcategoryId) => {
    const newSelected = localSelectedSubcategories.includes(subcategoryId)
      ? localSelectedSubcategories.filter((id) => id !== subcategoryId)
      : [...localSelectedSubcategories, subcategoryId];
    setLocalSelectedSubcategories(newSelected);
  };

  const handleApply = () => {
    onApply({
      categories: localSelectedCategories,
      subcategories: localSelectedSubcategories,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalSelectedCategories([]);
    setLocalSelectedSubcategories([]);
  };

  const getAvailableSubcategories = () => {
    if (localSelectedCategories.length === 0) {
      return [];
    }
    return subcategories.filter((sub) =>
      localSelectedCategories.includes(sub.category_id),
    );
  };

  const getTotalSelectedCount = () => {
    return localSelectedCategories.length + localSelectedSubcategories.length;
  };

  const renderCategories = () => (
    <ScrollView style={styles.optionsList}>
      {categories.map((category) => {
        const isSelected = localSelectedCategories.includes(category.id);
        const subcategoryCount = subcategories.filter(
          (sub) => sub.category_id === category.id,
        ).length;

        return (
          <TouchableOpacity
            key={category.id}
            style={[styles.optionItem, isSelected && styles.selectedOption]}
            onPress={() => toggleCategory(category.id)}
          >
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}
              >
                {category.label}
              </Text>
              <Text style={styles.subcategoryCount}>
                {subcategoryCount} subcategories
              </Text>
            </View>
            {isSelected && <Icon name="check" size={20} color="#121416" />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderSubcategories = () => {
    const availableSubcategories = getAvailableSubcategories();

    if (localSelectedCategories.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Select categories first to see subcategories
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.optionsList}>
        {availableSubcategories.map((subcategory) => {
          const isSelected = localSelectedSubcategories.includes(
            subcategory.id,
          );
          const parentCategory = categories.find(
            (cat) => cat.id === subcategory.category_id,
          );

          return (
            <TouchableOpacity
              key={subcategory.id}
              style={[styles.optionItem, isSelected && styles.selectedOption]}
              onPress={() => toggleSubcategory(subcategory.id)}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText,
                  ]}
                >
                  {subcategory.label}
                </Text>
                <Text style={styles.parentCategory}>
                  {parentCategory?.label}
                </Text>
              </View>
              {isSelected && <Icon name="check" size={20} color="#121416" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#121416" />
          </TouchableOpacity>
          <Text style={styles.title}>Filter by Category</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeView === "categories" && styles.activeTab,
            ]}
            onPress={() => setActiveView("categories")}
          >
            <Text
              style={[
                styles.tabText,
                activeView === "categories" && styles.activeTabText,
              ]}
            >
              Categories ({categories.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeView === "subcategories" && styles.activeTab,
            ]}
            onPress={() => setActiveView("subcategories")}
          >
            <Text
              style={[
                styles.tabText,
                activeView === "subcategories" && styles.activeTabText,
              ]}
            >
              Subcategories ({getAvailableSubcategories().length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeView === "categories"
            ? renderCategories()
            : renderSubcategories()}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>
              Apply
              {getTotalSelectedCount() > 0
                ? ` (${getTotalSelectedCount()})`
                : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#121416",
  },
  clearButton: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  clearText: {
    fontSize: 16,
    color: "#6a7681",
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#121416",
  },
  tabText: {
    fontSize: 16,
    color: "#6a7681",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#121416",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  optionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedOption: {
    backgroundColor: "#f8fafc",
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#121416",
    fontWeight: "600",
  },
  subcategoryCount: {
    fontSize: 14,
    color: "#6a7681",
    marginTop: 2,
  },
  parentCategory: {
    fontSize: 14,
    color: "#6a7681",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6a7681",
    textAlign: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  applyButton: {
    backgroundColor: "#121416",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CategoryFilterModal;
