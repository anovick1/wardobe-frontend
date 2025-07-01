import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TagsPreview({ tags }) {
  if (tags.length === 0) {
    return <Text style={styles.placeholderText}>Add tags...</Text>;
  }

  return (
    <View style={styles.tagsPreview}>
      <View style={styles.tagsPreviewContainer}>
        {tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tagPreviewChip}>
            <Text style={styles.tagPreviewText}>{tag}</Text>
          </View>
        ))}
        {tags.length > 3 && (
          <Text style={styles.moreTagsText}>+{tags.length - 3} more</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tagsPreview: {
    flex: 1,
  },
  tagsPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  tagPreviewChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 2,
  },
  tagPreviewText: {
    fontSize: 12,
    color: "#374151",
  },
  moreTagsText: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
  },
  placeholderText: {
    color: "#9ca3af",
    fontWeight: "400",
    fontSize: 15,
    flex: 1,
  },
});
