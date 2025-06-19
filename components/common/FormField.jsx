import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function FormField({
  label,
  value,
  placeholder,
  onPress,
  icon = "edit",
  disabled = false,
  numberOfLines = 1,
  children,
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.pillButton, disabled && styles.pillButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        {children || (
          <Text
            style={[
              styles.pillButtonText,
              !value && styles.pillButtonTextPlaceholder,
            ]}
            numberOfLines={numberOfLines}
          >
            {value || placeholder}
          </Text>
        )}
        <Icon name={icon} size={18} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
});
