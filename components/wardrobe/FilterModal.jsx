import React, { useState } from "react";
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

const FilterModal = ({ 
  visible, 
  onClose, 
  filterType, 
  options, 
  selectedValues = [], 
  onApply 
}) => {
  const [localSelectedValues, setLocalSelectedValues] = useState(selectedValues);

  const toggleValue = (value) => {
    const newSelected = localSelectedValues.includes(value)
      ? localSelectedValues.filter(v => v !== value)
      : [...localSelectedValues, value];
    setLocalSelectedValues(newSelected);
  };

  const handleApply = () => {
    onApply(localSelectedValues);
    onClose();
  };

  const handleClear = () => {
    setLocalSelectedValues([]);
  };

  const getTitle = () => {
    switch (filterType) {
      case 'brand': return 'Filter by Brand';
      case 'category': return 'Filter by Category';
      case 'color': return 'Filter by Color';
      case 'tags': return 'Filter by Tags';
      default: return 'Filter';
    }
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
          <Text style={styles.title}>{getTitle()}</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <ScrollView style={styles.optionsList}>
          {options.map((option) => {
            const isSelected = localSelectedValues.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionItem,
                  isSelected && styles.selectedOption
                ]}
                onPress={() => toggleValue(option)}
              >
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
                {isSelected && (
                  <Icon name="check" size={20} color="#121416" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>
              Apply{localSelectedValues.length > 0 ? ` (${localSelectedValues.length})` : ''}
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
  optionText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  selectedOptionText: {
    color: "#121416",
    fontWeight: "500",
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

export default FilterModal;