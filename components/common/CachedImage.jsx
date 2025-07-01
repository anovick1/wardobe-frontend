import React from "react";
import { Image, ActivityIndicator, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import useCachedImage from "../../hooks/useCachedImage";

export default function CachedImage({ imageUrl, itemId, style, ...props }) {
  const { uri, loading, error } = useCachedImage(imageUrl, itemId);

  if (loading) {
    return (
      <View style={[style, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[style, { alignItems: "center", justifyContent: "center" }]}>
        <Icon name="error" size={36} color="#dc2626" />
      </View>
    );
  }
  return <Image source={{ uri }} style={style} {...props} />;
}
