import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { locationsAPI } from "../../api";

export default function LocationSelector({ selectedLocation, onLocationSelect, placeholder = "Enter location" }) {
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLocation) {
      setQuery(selectedLocation.display_name || selectedLocation);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      searchLocations(query);
    } else {
      setFiltered([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const searchLocations = async (searchQuery) => {
    try {
      const response = await locationsAPI.searchLocations(searchQuery);
      const searchResults = response.locations || [];
      setFiltered(searchResults);
      setShowSuggestions(searchResults.length > 0);
    } catch (error) {
      console.error("Error searching locations:", error);
      setFiltered([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (location) => {
    onLocationSelect(location);
    setQuery(location.display_name);
    setShowSuggestions(false);
  };

  const handleTextChange = (text) => {
    setQuery(text);
    if (text.length < 2) {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    if (query.length >= 2 && filtered.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };


  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Icon name="place" size={20} color="#6b7280" style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          value={query}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
        />
        {loading && (
          <Icon name="refresh" size={20} color="#6b7280" style={styles.loadingIcon} />
        )}
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <Icon name="place" size={16} color="#6b7280" style={styles.locationIcon} />
                <Text style={styles.suggestionText}>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#121416",
  },
  loadingIcon: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  locationIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
});