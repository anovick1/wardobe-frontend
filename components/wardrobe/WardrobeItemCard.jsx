import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import useCachedImage from "../../hooks/useCachedImage";
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";

export default function WardrobeItemCard({ item, onItemDeleted }) {
  const navigation = useNavigation();
  const { uri, loading, error } = useCachedImage(item.image_url, item.id);

  return (
    <TouchableOpacity
      style={cardStyles.cardTouchable}
      onPress={() =>
        navigation.navigate("WardrobeItemDetail", {
          item,
        })
      }
    >
      <View style={cardStyles.card}>
        <View style={cardStyles.image}>
          {loading ? (
            <ActivityIndicator style={{ flex: 1 }} />
          ) : error ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="error" size={36} color="#dc2626" />
            </View>
          ) : (
            <Image source={{ uri }} style={cardStyles.image} />
          )}
        </View>
        <View style={cardStyles.infoSection}>
          <Text style={typography.name} numberOfLines={1} adjustsFontSizeToFit>
            {item.name || "Unnamed item"}
          </Text>
          {item.brand && (
            <Text
              style={typography.brand}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {item.brand}
            </Text>
          )}
          {item.wardrobe_item_type && (
            <Text style={cardStyles.tagText} numberOfLines={1}>
              {item.wardrobe_item_type}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
