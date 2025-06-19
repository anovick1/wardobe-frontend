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
  canGoBack,
  canGoForward,
}) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Icon name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
    
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
        onPress={() => webViewRef.current?.goBack()}
        disabled={!canGoBack}
      >
        <Icon name="arrow-back-ios" size={20} color={canGoBack ? "#000" : "#ccc"} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
        onPress={() => webViewRef.current?.goForward()}
        disabled={!canGoForward}
      >
        <Icon name="arrow-forward-ios" size={20} color={canGoForward ? "#000" : "#ccc"} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => webViewRef.current?.reload()}
      >
        <Icon name="refresh" size={20} color="#000" />
      </TouchableOpacity>
    </View>
    
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
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: 8,
    marginRight: 6,
  },
  navigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 8,
  },
  navButton: {
    padding: 6,
    marginHorizontal: 2,
    borderRadius: 6,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  urlContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
});


export default UrlHeader;
