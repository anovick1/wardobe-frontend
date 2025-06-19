import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const { height: screenHeight } = Dimensions.get("window");

export default function ModalTextInput({
  visible,
  onClose,
  title,
  value,
  onSave,
  placeholder = "Enter text...",
  multiline = false,
  keyboardType = "default",
  isPriceInput = false,
}) {
  const [text, setText] = useState(value || "");

  // Update local text when value prop changes
  useEffect(() => {
    if (isPriceInput && value) {
      // Format as currency for display
      const numValue = parseFloat(value);
      setText(isNaN(numValue) ? "" : numValue.toString());
    } else {
      setText(value || "");
    }
  }, [value, isPriceInput]);

  const handleTextChange = (newText) => {
    if (isPriceInput) {
      // Only allow numbers and decimal point
      const cleaned = newText.replace(/[^0-9.]/g, "");
      // Ensure only one decimal point
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        return; // Don't update if more than one decimal point
      }
      setText(cleaned);
    } else {
      setText(newText);
    }
  };

  const handleSave = () => {
    if (isPriceInput) {
      // Parse the number and save as string
      const numValue = parseFloat(text);
      onSave(isNaN(numValue) ? "" : numValue.toString());
    } else {
      onSave(text);
    }
    onClose();
  };

  const handleCancel = () => {
    if (isPriceInput && value) {
      const numValue = parseFloat(value);
      setText(isNaN(numValue) ? "" : numValue.toString());
    } else {
      setText(value || "");
    }
    onClose();
  };

  const getDisplayValue = () => {
    if (isPriceInput && text) {
      const numValue = parseFloat(text);
      return isNaN(numValue) ? text : `$${numValue.toFixed(2)}`;
    }
    return text;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={styles.container}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            value={getDisplayValue()}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            style={[styles.textInput, multiline && styles.textInputMultiline]}
            autoFocus
            multiline={multiline}
            keyboardType={keyboardType}
            textAlignVertical={multiline ? "top" : "center"}
            numberOfLines={multiline ? 4 : 1}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: screenHeight * 0.7,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    color: "#111827",
  },
  textInputMultiline: {
    minHeight: 120,
    maxHeight: 200,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
