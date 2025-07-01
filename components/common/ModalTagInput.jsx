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
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const { height: screenHeight } = Dimensions.get("window");

export default function ModalTagInput({
  visible,
  onClose,
  title,
  tags,
  onSave,
  placeholder = "Add a tag...",
}) {
  const [localTags, setLocalTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  // Update local tags when tags prop changes
  useEffect(() => {
    setLocalTags([...tags]);
  }, [tags]);

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !localTags.includes(trimmedTag)) {
      setLocalTags([...localTags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setLocalTags(localTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === "Enter" || e.nativeEvent.key === " ") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSave = () => {
    onSave(localTags);
    onClose();
  };

  const handleCancel = () => {
    setLocalTags([...tags]); // Reset to original tags
    setNewTag("");
    onClose();
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

          {/* Current tags */}
          {localTags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Current Tags</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tagsScrollView}
                contentContainerStyle={styles.tagsContainer}
              >
                {localTags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => removeTag(tag)}
                      style={styles.tagRemoveButton}
                    >
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Add new tag */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Add New Tag</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={newTag}
                onChangeText={setNewTag}
                placeholder={placeholder}
                style={styles.textInput}
                autoFocus
                onSubmitEditing={addTag}
                onKeyPress={handleKeyPress}
                returnKeyType="done"
              />
              {newTag.trim() && (
                <TouchableOpacity style={styles.addButton} onPress={addTag}>
                  <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Tags</Text>
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
    maxHeight: screenHeight * 0.8,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  tagsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  tagsScrollView: {
    maxHeight: 120,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#374151",
    marginRight: 8,
  },
  tagRemoveButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  inputSection: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    color: "#111827",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
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
