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
  const [isFocused, setIsFocused] = useState(true); // Start focused since autoFocus is true

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
      // Remove the dollar sign if present
      let cleaned = newText.replace(/^\$/, "");
      // Remove any non-numeric characters except decimal point
      cleaned = cleaned.replace(/[^0-9.]/g, "");
      
      // Special handling: if we already have 2 decimal places and user types a number
      const parts = cleaned.split(".");
      if (parts.length === 2 && parts[1].length > 2) {
        // User typed a new digit after 2 decimal places
        // Shift everything: ABC.DE + F => ABCD.EF
        const beforeDecimal = parts[0];
        const afterDecimal = parts[1];
        const newBeforeDecimal = beforeDecimal + afterDecimal[0];
        const newAfterDecimal = afterDecimal.substring(1, 3);
        cleaned = newBeforeDecimal + "." + newAfterDecimal;
      }
      
      // Handle multiple decimal points
      if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
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

          <View style={styles.inputContainer}>
            {isPriceInput && (
              <Text style={styles.dollarSign}>$</Text>
            )}
            <TextInput
              value={text}
              onChangeText={handleTextChange}
              placeholder={isPriceInput ? "0.00" : placeholder}
              style={[
                styles.textInput, 
                multiline && styles.textInputMultiline,
                isPriceInput && styles.priceTextInput
              ]}
              autoFocus
              multiline={multiline}
              keyboardType={keyboardType}
              textAlignVertical={multiline ? "top" : "center"}
              numberOfLines={multiline ? 4 : 1}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dollarSign: {
    position: "absolute",
    left: 16,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    zIndex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    color: "#111827",
    flex: 1,
  },
  priceTextInput: {
    paddingLeft: 30, // Make room for dollar sign
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
