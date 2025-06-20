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
import cardStyles from "../../styles/card";
import typography from "../../styles/typography";
import useCachedImage from "../../hooks/useCachedImage";

export default function OutfitCard({ item }) {
  const navigation = useNavigation();

  const { uri, loading, error } = useCachedImage(
    item.composite_image_url,
    item.id
  );

  return (
    <TouchableOpacity
      style={cardStyles.cardTouchable}
      onPress={() =>
        navigation.navigate("OutfitDetail", {
          outfitId: item.id,
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
          ) : uri ? (
            <Image
              source={{ uri }}
              style={cardStyles.image}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              <Icon name="style" size={36} color="#ccc" />
            </View>
          )}
        </View>
        <View style={cardStyles.infoSection}>
          <Text style={typography.name} numberOfLines={1} adjustsFontSizeToFit>
            {item.title || "Untitled Outfit"}
          </Text>
          <Text style={typography.brand} numberOfLines={1} adjustsFontSizeToFit>
            {item.item_count} {item.item_count === 1 ? "item" : "items"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
