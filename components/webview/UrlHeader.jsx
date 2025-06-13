import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const UrlHeader = ({
  urlInput,
  setUrlInput,
  handleUrlSubmit,
  isUrlFocused,
  setIsUrlFocused,
  webViewRef,
  onBack,
}) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Icon name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
    <View style={styles.urlContainer}>
      <TextInput
        style={styles.urlInput}
        placeholder="Enter URL"
        value={urlInput}
        onChangeText={setUrlInput}
        onSubmitEditing={handleUrlSubmit}
        onFocus={() => setIsUrlFocused(true)}
        onBlur={() => setIsUrlFocused(false)}
        autoCapitalize="none"
        keyboardType="url"
        returnKeyType="go"
      />
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => webViewRef.current?.reload()}
      >
        <Icon name="refresh" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  urlContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  urlInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#000",
  },
  refreshButton: {
    padding: 8,
  },
});

export default UrlHeader;
