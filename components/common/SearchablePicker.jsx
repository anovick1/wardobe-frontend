import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const { height: screenHeight } = Dimensions.get("window");

export default function SearchablePicker({
  visible,
  onClose,
  title,
  data,
  onSelect,
  selectedValue,
  loading = false,
  allowAdd = false,
  placeholder = "No items",
}) {
  const [search, setSearch] = useState("");

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) setSearch("");
  }, [visible]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const result = data.filter((item) =>
      item.label.toLowerCase().includes(search.trim().toLowerCase())
    );
    return result;
  }, [search, data]);

  const listData = useMemo(() => {
    if (allowAdd && search.trim() && filtered.length === 0) {
      return [
        {
          label: `➕  Add "${search.trim()}"`,
          value: search.trim(),
          isNew: true,
        },
      ];
    }
    return filtered;
  }, [filtered, search, allowAdd]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        onSelect(item);
        setSearch("");
        onClose();
      }}
    >
      <Text
        style={[
          styles.rowText,
          item.value === selectedValue && styles.rowTextActive,
          item.isNew && styles.rowTextNew,
        ]}
      >
        {item.label}
      </Text>
      {item.value === selectedValue && (
        <Icon name="check" size={20} color="#111827" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            style={styles.searchInput}
            autoFocus
          />

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : listData.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{placeholder}</Text>
            </View>
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => item.value}
              renderItem={renderItem}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
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
    minHeight: screenHeight * 0.5,
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowText: {
    fontSize: 16,
    color: "#374151",
  },
  rowTextActive: {
    fontWeight: "600",
    color: "#111827",
  },
  rowTextNew: {
    color: "#0ea5e9",
    fontWeight: "600",
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
  },
  list: {
    flex: 1,
    minHeight: 200,
  },
});
